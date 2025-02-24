import { TableProcessBetQueue } from "sc-game-base/src/table/crons";
import { getOrDefault, callAndForget } from "sc-game-base/src/core/game-management-api";
import { logger } from "sc-common";
import { MarbleFootballGameStateManager, Payload, Player, PlayerInGame, Session } from "../game-state";
import { tracer } from "sc-instrument";

type BetPayload = {
    amount: number;
    betChoice: string;
    roundId: number;
    clientSeed: Date;
    freeBet?: boolean;
    mode?: string;
};


export default class ProcessBetQueue extends TableProcessBetQueue {
    private gameStateManager: MarbleFootballGameStateManager;

    constructor(props: any) {
        super(props);
        const { gameStateManager } = props;
        this.gameStateManager = gameStateManager; 
    }
    
    adjustTotalBets(player: any, bet: BetPayload, rate: number) {
        super.adjustTotalBets(player, bet, rate);
        const { betChoice, amount } = bet;
        this.gameStateManager.totalBets[betChoice] = (this.gameStateManager.totalBets[betChoice] ?? 0) + amount * rate;
        this.adjustPlayerBetCount(player, bet.betChoice);
    }

    adjustPlayerBetCount(player: any, betChoice: string) {
        if (this.definition.choices.includes(betChoice)) {
            if (!this.gameStateManager.playerBetCount[betChoice]) {
                this.gameStateManager.playerBetCount[betChoice] = [];
            }
            !this.gameStateManager.playerBetCount[betChoice].includes(player.UID) && this.gameStateManager.playerBetCount[betChoice].push(player.UID);
        }
    }

    dequeueBets() {
        if (!this.gameStateManager.ingame) return;
        const self = this;
        Object.values(this.gameStateManager.ingame).forEach(
            player => this.dequeuePlayerBets(self, player)
        );
    }

    private dequeuePlayerBets(self: ProcessBetQueue, playerInGame: PlayerInGame) {
        if (!(!playerInGame.betProcessing && playerInGame.betQueue && playerInGame.betQueue.length > 0)) return;
        
        const betQueueItem = playerInGame.betQueue.shift();
        if (!betQueueItem) return;

        const { player, payload } = betQueueItem;
        playerInGame.betProcessing = true;

        tracer.startActiveSpan("dequeueBet", async (span) => {
            self.proceedBets(player, payload)
                .then(() => (playerInGame.betProcessing = false))
                .catch(self.logService.logError)
                .finally(() => span.end());
        });
    }

    private async proceedBets(player:Player, payload: Payload) {
        const betInfo = this.formatApiBetInfo(payload);
        
        if (!(await this.validateBetRequest(player, payload))) return;

        const apiResult =
            await this.placeBet({ id: player.UID, session: player.session },
                betInfo
            );
        const { response } = apiResult;

        if (apiResult.isOk) {
            await this.handleSuccessBet(player, response, betInfo.gameRoundId, payload)
        } else {
            this.handleFailedBet(player, response, payload);
            
            if (
                (player.profile.minBet !== response.apiError?.minBet || player.profile.maxBet !== response.apiError?.maxBet) &&
                response.apiError?.minBet > 0 &&
                response.apiError?.maxBet > 0
            ) {
                this.updateUserStakeLevel(player, response.apiError.minBet, response.apiError.maxBet);
            }
        }

        const totalProcessedTime = (Date.now() - payload.receivedTime.getTime()) / 1000;
        this.baseMetrics.collectBetProcessedTime(totalProcessedTime);
    }

    async handleSuccessBet(player:any, balance: any, roundId: any, bet: any) {
        const rate = this.calculateCurrencyRate(player.session);

        if (this.betLogsRepository) {
            await this.insertBetLog(player, roundId, bet, rate);
        }

        await this.upsertBet(player, roundId, bet, rate);

        if (this.isCountOnTotalBets(player)) {
            this.adjustTotalBets(player, bet, rate);
        }

        this.adjustOwnBets(player.profile.name, bet);

        if (bet.freeBet) {
            const user = await getOrDefault(
                this.gameManagementApiClient.users.setBalanceAndDecreaseScoins({
                    id: player.UID,
                    balance: balance.red,
                    deductionscoins: bet.amount,
                }),
                { red: balance.red, scoins: 0 }
            );
            this.notifyPlacingBetResult(player, { ...balance, scoins: user.scoins }, bet, rate);
        } else {
            callAndForget(
                this.gameManagementApiClient.users.setBalanceAndDecreaseScoins({
                    id: player.UID,
                    balance: balance.red,
                    deductionscoins: 0,
                })
            );
            this.notifyPlacingBetResult(player, balance, bet, rate);
        }

        if (!bet.freeBet && (player.profile.minBet !== balance.minBet || player.profile.maxBet !== balance.maxBet)) {
            this.updateUserStakeLevel(player, balance.minBet, balance.maxBet);
        }
    }

    calculateCurrencyRate(session: Session) {
        const exchangeRates = this.gameStateManager.exchangeRates;
        if (!exchangeRates.code) return 1;

        const playerCurrencyExchangeRate = exchangeRates.code[session.currencyCode];
        return session.multiplier * playerCurrencyExchangeRate;
    }
    
    isCountOnTotalBets(player: Player) {
        return this.gameStateManager.currencies.some(
            (currency) =>
                currency.partnerId === player.session.operatorId &&
                currency.name === player.session.currencyName &&
                !(currency.isTest && currency.isUncountOnTotal)
        );
    }

    adjustOwnBets(playerName: string, bet: BetPayload) {
        super.adjustOwnBets(playerName, bet);
        const { betChoice, amount } = bet;
        if (!this.gameStateManager.ingame[playerName]) return;

        const playerInGame = this.gameStateManager.ingame[playerName];

        playerInGame.ownBets[betChoice] = (playerInGame.ownBets[betChoice] ?? 0) + amount;
    }
}
