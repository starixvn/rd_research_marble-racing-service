import { Core } from "sc-game-base";
import { GameStateManager } from "../game-state";
import mongoose from "mongoose";
import GameManagementApiClientFactory from "sc-game-base/src/core/game-management-api";

export default class RoundIdConsumer extends Core.BaseEventConsumers.RoundIdConsumer {
    gameStateManager: GameStateManager;

    constructor(
        gameData: Core.GameData, 
        definition: Core.GameDefinition, 
        roundsRepository: mongoose.Model<any>, 
        gameManagementApiClientFactory: GameManagementApiClientFactory, 
        gameStateManager: GameStateManager
    ) {
            
        super(gameData, definition, roundsRepository, gameManagementApiClientFactory);
        this.gameStateManager = gameStateManager 
    }

    async initRoundId() {
        const lastRound = await this.roundsRepository
        .findOne({}, "id", { sort: { id: -1 } })
        .lean()
        .exec();

        if (lastRound) {
            this.gameStateManager.roundId = lastRound.id + 1;
        } else {
            this.gameStateManager.roundId = await this.getLastArchiveRound();
        }
    }
}