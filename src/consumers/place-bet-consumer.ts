import { Core } from "sc-game-base";
import {  GameData, GameDefinition } from "sc-game-base/src/core";
import { BaseEventPublisher } from "sc-game-base/src/core/event-publishers";
import { GameStateManager, Player } from "../game-state";
export default class PlaceBetConsumer extends Core.BaseEventConsumers.PlaceBetConsumer {
    /**
     * @param {GameDefinition} definition
     * @param {GameData} gameData
     * @param {BaseEventPublisher} publisher
     * @param {GameStateManager} gameStateManager
     */
    constructor(definition: GameDefinition, gameData: GameData, publisher: BaseEventPublisher, gameStateManager: GameStateManager) {
        super(definition, gameData, publisher)
        this._gameStateManager = gameStateManager;
    }

    private _gameStateManager: GameStateManager;

    override consume(player: any, payload: any): void {
        Object.assign(payload, {
            amount: payload.amount >> 0,
            freeBet: payload.freeBet ?? false,
            roundId: payload.roundId ?? this.gameData.roundId,
            mode: payload.m ?? this.DisplayMode.Landscape,
            receivedTime: new Date(),
        });

        const { amount, betChoice, freeBet, roundId } = payload;
        const name = player.profile.name;

        if (!this.validateRequestParams(payload, player) || !this.validateBetRequest(player, betChoice, amount, freeBet, roundId)) {
            return;
        }

        if (!this.gameData.ingame[name]) {
            const newPlayer = {
                name: player.profile.name,
                currency: player.session.currencyName,
                system: player.session.system,
                betTracks: {},
                betQueue: [],
                clientSeed: payload.clientSeed,
                operatorId: player.session.operatorId,
            };

            this.gameData.ingame[name] = newPlayer;
        }

        if (!this._gameStateManager.ingame[name]) {
            const newPlayer = new Player({
                clientSeed: (payload.clientSeed) as string,
                currency: (player.session.currencyName) as string,
                name: player.profile.name as string,
                operatorId: player.session.operatorId as string,
                system: player.session.system as string
            });

            this._gameStateManager.ingame[name] = newPlayer;
        }

        this.adjustBetTracks(player.profile.name, payload);

        if (this._gameStateManager.ingame?.[name]) {
            const playerInGame = this.gameData.ingame[name];

            playerInGame.betTracks[betChoice] = (playerInGame.betTracks[betChoice] ?? 0) + payload.amount;
        }

        
        this.gameData.ingame[name].betQueue.push({ player, payload });
        this._gameStateManager.ingame[name].betQueue.push({ player, payload});
    }
}