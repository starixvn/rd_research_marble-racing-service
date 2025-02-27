import { TableGameConfigBot } from "sc-game-base/src/table/crons";
import GameData from "../game-data";
import { MarbleFootballGameStateManager } from "../game-state";

export default class Bot extends TableGameConfigBot {
    declare gameData: GameData;
    gameStateManager: MarbleFootballGameStateManager;

    constructor(definition: any,
        gameData: any, 
        publisher: any, 
        gameManagementApiClientFactory: any, 
        tempBetsRepository: any, 
        gameStateManager: MarbleFootballGameStateManager,
    ) {
        super(
            definition,
            gameData,
            publisher,
            gameManagementApiClientFactory,
            tempBetsRepository,
        )

        this.gameStateManager = gameStateManager;
    }

    override updateBalanceAndPublishBetPayload(botId: string, choice: string, amount: number, balance: number) {
        super.updateBalanceAndPublishBetPayload(botId, choice, amount, balance);
        this.updatePlayerBetCount(botId, choice);
    }

    updatePlayerBetCount(playerId: string, choice: string) {
        if (this.definition.choices.includes(choice)) {
            if (!this.gameStateManager.playerBetCount[choice]) {
                this.gameStateManager.playerBetCount[choice] = [];
            }
            !this.gameStateManager.playerBetCount[choice].includes(playerId) && this.gameStateManager.playerBetCount[choice].push(playerId);
        }
    }
}
