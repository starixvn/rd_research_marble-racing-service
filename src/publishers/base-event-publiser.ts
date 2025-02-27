import { Core } from "sc-game-base";
import { GameData } from "sc-game-base/src/core";
import { GameStateManager } from "../game-state";

export default class BaseEventPublisher extends Core.BaseEventPublishers.BaseEventPublisher {
    gameStateManager: GameStateManager;

    constructor(gameName: string, gameData: GameData, gameStateManager: GameStateManager) {
        super(gameName, gameData);
        this.gameStateManager = gameStateManager;
    }

    publishToAllUsers(payload: any): void {
        const sockets = Object.values(this.gameStateManager.realPlayers).map(player => player.socketClient);

        sockets.forEach((socket) => {
            socket && socket.emit(this.gameName, payload);
        })
    }

    publishToAllUsersExcept(userId: string, payload: any): void {
        const sockets = Object.values(this.gameStateManager.realPlayers)
            .filter(player => player.UID !== userId)
            .map(player => player.socketClient);
        
        sockets.forEach((socket) => {
            socket && socket.emit(this.gameName, payload);
        })
    }

    publishToAllUsersExceptSystem(system: any, userId: string, payload: any): void {
        const sockets = Object.values(this.gameStateManager.realPlayers)
            .filter(player => player.session?.system !== system && player.UID !== userId)
            .map(player => player.socketClient);
        sockets.forEach((socket) => {
            socket && socket.emit(this.gameName, payload);
        })
    }

    publishToUser(userId: string, payload: any, path: string = this.gameName): void {
        const realPlayer = Object.values(this.gameStateManager.realPlayers)
            .find(player => player.UID === userId && player.socketClient && player.socketClient.connected);
        
            realPlayer?.socketClient?.emit(path, payload);
    }

    publishToAllAdmins(payload: any): void {
        const socketAdmins = Object.values(this.gameStateManager.admins)
            .map((admin) => admin.socketClient)
            .filter((socket) => socket.connected);

        socketAdmins.forEach((socket) => {
            socket && socket.emit("message", { [this.gameName]: payload });
        });
    }

    publishApiError(userId: string, apiError: any) {
        this.publishToUser(userId, apiError);
    }
}