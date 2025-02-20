import { TableProcessBetQueue } from "sc-game-base/src/table/crons";
import GameData from "../game-data";
import { GameStateManager, Player } from "../game-state";
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
    private _gameStateManager: GameStateManager;
    declare gameData: GameData;

    constructor(props: any) {
        super(props);
        const { gameStateManager } = props;
        this._gameStateManager = gameStateManager; 
    }

    dequeueBets() {
        this.dequeueManagedBets();
        if (!this.gameData.ingame) return;
        Object.values(this.gameData.ingame).forEach((playerInGame) => {
            if (!playerInGame.betProcessing && playerInGame.betQueue && playerInGame.betQueue.length > 0) {
                console.log("dequeue original bet")
                const self = this;
                const { player, payload } = playerInGame.betQueue.shift();
                playerInGame.betProcessing = true;

                tracer.startActiveSpan("dequeueBet", async (span) => {
                    self.proceedBet(player, payload)
                        .then(() => (playerInGame.betProcessing = false))
                        .catch(self.logService.logError)
                        .finally(() => span.end());
                });
            }
        });
    }
    
    
    adjustTotalBets(player: any, bet: BetPayload, rate: number) {
        super.adjustTotalBets(player, bet, rate);
        this.adjustPlayerBetCount(player, bet.betChoice);
    }

    adjustPlayerBetCount(player: any, betChoice: string) {
        if (this.definition.choices.includes(betChoice)) {
            if (!this.gameData.playerBetCount[betChoice]) {
                this.gameData.playerBetCount[betChoice] = [];
            }
            !this.gameData.playerBetCount[betChoice].includes(player.UID) && this.gameData.playerBetCount[betChoice].push(player.UID);
        }
    }

    private dequeueManagedBets() {
        if (!this._gameStateManager.ingame) return;
        const self = this;
        Object.values(this._gameStateManager.ingame).forEach(
            player => this.dequeuePlayerBets(self, player)
        );
    }

    private dequeuePlayerBets(self: ProcessBetQueue, playerInGame: Player) {
        if (!(!playerInGame.betProcessing && playerInGame.betQueue && playerInGame.betQueue.length > 0)) return;
        
        const betQueueItem = playerInGame.betQueue.shift();
        if (!betQueueItem) return;

        const { player, payload } = betQueueItem;
        playerInGame.betProcessing = true;

        tracer.startActiveSpan("dequeueBet", async (span) => {
            self.managedProceedBets(player, payload)
                .then(() => (playerInGame.betProcessing = false))
                .catch(self.logService.logError)
                .finally(() => span.end());
        });
    }

    private async managedProceedBets(player:any, payload: any) {
        return Promise.resolve();
    }

}
