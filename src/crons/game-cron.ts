import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import { Table } from "sc-game-base";
import AppConfigs from "../app-configs";
import { TournamentConsumer } from "../consumers";
import GameDefinition from "../game-definition";
import { retry } from "../helpers";
import { generateVideoName } from "../helpers/result-helper";
import defaultVideoTimelines from "../timelines/video-timelines";
import { GameStateManager, MarbleFootballGameStateManager } from "../game-state";
import { getOrDefault, post } from "sc-game-base/src/core/game-management-api"

export default class GameCron extends Table.Crons.TableGameCron {
    declare definition: GameDefinition;
    declare appConfigs: typeof AppConfigs;
    declare gameStateManager: MarbleFootballGameStateManager;

    tournamentConsumer: TournamentConsumer;

    constructor(container: any) {
        super(container);

        this.tournamentConsumer = container.tournamentConsumer;
        this.gameStateManager = container.gameStateManager;
        this.gameStateManager.liveStreamServer = this.appConfigs.liveStreamServer;
    }

    async queryLastResult() {
        await super.queryLastResult();
        const lastTournament = await this.tournamentConsumer.getLastTournament();
        this.gameStateManager.publishedTournament = lastTournament;
    }

    override resetForNewRound() {
        super.resetForNewRound();
        this.gameStateManager.playerBetCount = {};
        this.gameStateManager.ingame = {}
    }

    async getVideoTimeline(videoName: string) {
        const url = new URL(`${videoName}.json`, this.appConfigs.liveStreamServer);

        const agent = this.appConfigs.proxyServer.enabled ? new HttpsProxyAgent(this.appConfigs.proxyServer.url) : undefined;

        try {
            const response = await axios.get(url.toString(), { httpsAgent: agent });

            return response.data.timeLine;
        } catch (error) {
            this.logService.logError(`In match ${this.gameStateManager.roundId}, failed to get video timeline ${url} with error: ${error}`);
            throw error;
        }
    }

    async getAndProcessVideoTimeline() {
        const delay = 100;
        const retries = 3;

        try {
            const resultVideoName =  this.gameStateManager.result.resultVideoName ?? ""
            const videoTimeline = 
                await retry(
                    () => this.getVideoTimeline(
                       resultVideoName), 
                        retries, 
                        delay);

            this.gameStateManager.result.videoTimeline = videoTimeline;
        } catch (error) {
            this.logService.logError(`Unexpected error fetching video timelines: ${error}`);
            const videoResult = this.gameStateManager.result.result ?? "";
            this.gameStateManager.result.videoTimeline = this.getDefaultVideoTimeline(videoResult);
        }
    }

    getDefaultVideoTimeline(result: string) {
        const videoName = generateVideoName(result, true);
        this.gameStateManager.result.resultVideoName = videoName;

        const videoTimeline = (defaultVideoTimelines as Record<string, number[]>)[`${videoName}_${result}`];

        this.logService.logWarning(`Get default video timeline for ${videoName}_${result}: ${videoTimeline}`);

        return videoTimeline;
    }

    async generateRoundData() {
        await this.roundResultConsumer.generateResult();

        this.gameStateManager.settlementResultFromAdmin = {};
    }

    publishVideoStream() {
        const videoResult = {
            resultVideoName: this.gameStateManager.result.resultVideoName,
            videoTimeline: this.gameStateManager.result.videoTimeline,
            result: this.gameStateManager.result.result,
        };

        this.runningRoundInfoPublisher.publishToAllUsers({ videoResult });
    }

    async publishTournament() {
        const tournament = await this.tournamentConsumer.getCurrentTournament();

        this.gameStateManager.publishedTournament = JSON.parse(JSON.stringify(tournament));
        this.runningRoundInfoPublisher.publishToAllUsers({ tournament });
    }

    override async proceed() {
        const { durations } = this.definition;
        console.log(this.gameStateManager.remainingTime)
        if (this.gameStateManager.remainingTime === durations.wholeRound) {
            await this.checkGameStatus();
        }

        if (!this.gameStateManager.disabled) {
            this.gameStateManager.remainingTime--;
        }

        const remainingTime = this.gameStateManager.remainingTime;
        if (remainingTime === durations.startingRound) {
            await this.publishTournament();
        }

        if (this.isStartingTime(remainingTime, durations)) {
            this.resetForNewRound();
            this.bot?.reset();

            await this.generateRoundData();
        }

        if (remainingTime === durations.placingBets) {
            this.gameStatusPublisher.publishStartPlacingBetStatus();
        }

        if (remainingTime === durations.lockingBet - 1) {
            this.gameStatusPublisher.publishEndPlacingBetStatus();
        }

        if (remainingTime === durations.streamingVideo) {
            await this.getAndProcessVideoTimeline();
            this.publishVideoStream();
        }

        if (remainingTime < 0) {
            this.gameStateManager.remainingTime = durations.wholeRound;

            await this.settleGameRoundConsumer.settleRound();
        }

        if (this.isDuringBetTime(remainingTime)) {
            this.bot && (await this.bot.run());
            this.runningRoundInfoPublisher.publish();
        }
    }

    isDuringBetTime(remainingTime: number) {
        const { placingBets, lockingBet } = this.definition.durations;

        return remainingTime < placingBets && remainingTime > lockingBet;
    }

    async getSettingForNewRound(): Promise<void> {
        super.getSettingForNewRound();
        const data = await getOrDefault(
            this.gameManagementApiClient.aggregation.getSettingForNewRound(this.definition.id),
            {
                currencyGroupGames: this.gameStateManager.currencyGroupGames,
                currencies: this.gameStateManager.currencies,
                partnerGameSiteExclusions: this.gameStateManager.partnerGameSiteExclusions,
                currencyGroups: this.gameStateManager.currencyGroups
            }
        );

        this.gameStateManager.currencyGroupGames = data.currencyGroupGames;
        this.gameStateManager.currencies = data.currencies;
        this.gameStateManager.partnerGameSiteExclusions = data.partnerGameSiteExclusions;
        this.gameStateManager.currencyGroups = data.currencyGroups;
    }

    async checkGameStatus(): Promise<void> {
        const { configName } = this.definition;

        const newGameConfigs = await getOrDefault(
            this.gameManagementApiClient.gameConfigs.getGameConfigs(configName),
            this.gameStateManager.gameConfigs
        );
        
        if (!newGameConfigs) {
            this.logService.logError(`Cannot get game configs of ${this.definition.name}.`)
        }

        const previouslyDisabled = this.gameStateManager.disabled;
        const configuredlyDisabled = !newGameConfigs || !newGameConfigs.enabled;

        if (previouslyDisabled) {
            this.gameStateManager.delayStartTime = this.getDelayStartTime(configuredlyDisabled, newGameConfigs)
        }

        this.assignNewGameConfigs(newGameConfigs);

        this.gameStateManager.disabled = configuredlyDisabled || this.gameStateManager.delayStartTime > 0;

        await this.getSettingForNewRound();

        if (!this.gameStateManager.gameConfigs.exchangeReload) {
            await this.updateExchangeRates();
            await post(this.gameManagementApiClient.gameConfigs.updateExchangeReload(false, configName));
        }

        this.handleGameStatus(previouslyDisabled);
    }

    assignNewGameConfigs(newGameConfigs: any): void {
        const originalOdds = newGameConfigs.odds;
        let transformedNewGameConfig = {
            ...newGameConfigs,
            originalOdds
        };
        const { gameConfigs: currentGameConfig } = this.gameStateManager;
        
        const boostedChoice = (currentGameConfig as { boostedChoices: string[]}).boostedChoices;

        const typedCurrentGameConfig = currentGameConfig as {
            odds: Record<string, number>;
            boostedChoices: string[]
        }

        if (boostedChoice && boostedChoice.length > 0) {
            transformedNewGameConfig = Object.assign(transformedNewGameConfig, {
                odds: typedCurrentGameConfig.odds,
                boostedChoices: typedCurrentGameConfig.boostedChoices,
            })
        }

        this.gameStateManager.gameConfigs = transformedNewGameConfig ?? {}
    }

    getDelayStartTime(configuredlyDisabled: boolean, newGameConfigs: any) {
        if (this.gameStateManager.delayStartTime > 0) {
            return this.gameStateManager.delayStartTime - 1;
        }

        if (!configuredlyDisabled) {
            return newGameConfigs?.delayStartTime ?? 0;
        }

        return 0;
    }

    async updateExchangeRates() {
        this.gameStateManager.exchangeRates = await getOrDefault(
            this.gameManagementApiClient.exchangeRates.getExchangeRates(),
            this.gameStateManager.exchangeRates
        );
    }

    async handleGameStatus(previouslyDisabled: boolean) {
        const { configName } = this.definition;

        if (this.gameStateManager.disabled) {
            const { durations } = this.definition;

            const notification = await getOrDefault(this.gameManagementApiClient.notification.getUmMessages(configName), {});

            this.gameStateManager.umMessages = notification;

            this.gameStateManager.remainingTime = durations.wholeRound;
            this.gameStatusPublisher.publishDisableGameStatus();
        } else if (previouslyDisabled) {
            await this.enableGame();
        } else {
            this.gameStatusPublisher.publishStartGame();
        }
    }
}