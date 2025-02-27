import { TableInGameConsumer } from "sc-game-base/src/table/event-consumers";
import GameData from "../game-data";
import GameDefinition from "../game-definition";
import { getUserBetPercentage } from "../helpers/bet-percentage";
import { Core } from "sc-game-base";
import { RoundQuery } from "sc-game-base/src/core/query-apis";
import GameManagementApiClientFactory from "sc-game-base/src/core/game-management-api";
import { GameStateManager, MarbleFootballGameStateManager } from "../game-state";

export default class InGameConsumer extends TableInGameConsumer {
    declare gameData: GameData;
    declare definition: GameDefinition;

    gameStateManager: MarbleFootballGameStateManager;

    constructor(
        definition: GameDefinition, 
        gameData: Core.GameData, 
        roundQuery: RoundQuery, 
        publisher: Core.BaseEventPublishers.BaseEventPublisher,
        getBalance: any,
        gameManagementApiClientFactory: GameManagementApiClientFactory,
        gameStateManager: MarbleFootballGameStateManager,
    ) {
        super(definition, gameData, roundQuery, publisher, getBalance, gameManagementApiClientFactory);
        this.gameStateManager = gameStateManager;
        
    }

    override async buildPayload(realPlayer: any) {
        const payload = await super.buildPayload(realPlayer);
        const { playerBetCount } = this.gameStateManager;
        const userBetPercentage = getUserBetPercentage(playerBetCount);
        const videoResult = this.getCurrentVideoResult();
        const liveStreamServer = this.gameStateManager.liveStreamServer;

        const tournament = this.gameStateManager.publishedTournament;
        return { ...payload, userBetPercentage, liveStreamServer, videoResult, tournament };
    }

    getCurrentVideoResult() {
        const { durations } = this.definition;

        const remainingTime = this.gameStateManager.remainingTime;

        const isStreamingVideo = remainingTime < durations.streamingVideo && remainingTime >= 0;

        const isShowingResult = remainingTime <= durations.wholeRound && remainingTime > durations.startingRound;

        if (isStreamingVideo) {
            return {
                resultVideoName: this.gameStateManager.result?.resultVideoName,
                videoTimeline: this.gameStateManager.result?.videoTimeline,
                result: this.gameStateManager.result?.result,
            };
        }

        if (isShowingResult) {
            return {
                videoTimeline: this.gameStateManager.result?.videoTimeline,
                result: this.gameStateManager.result?.result,
            };
        }

        return {};
    }
}
