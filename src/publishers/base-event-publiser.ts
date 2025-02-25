import { Core } from "sc-game-base";
import { GameData } from "sc-game-base/src/core";
import { GameStateManager } from "../game-state";

export default class BaseEventPublisher extends Core.BaseEventPublishers.BaseEventPublisher {
    gameStateManager: GameStateManager;

    constructor(gameName: string, gameData: GameData, gameStateManager: GameStateManager) {
        super(gameName, gameData);
        this.gameStateManager = gameStateManager;
    }

    
}