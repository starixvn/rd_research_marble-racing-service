import { Core } from "sc-game-base";
import {  GameData, GameDefinition } from "sc-game-base/src/core";
import { BaseEventPublisher } from "sc-game-base/src/core/event-publishers";
import { GameStateManager, Payload, Player, PlayerInGame } from "../game-state";




export default class PlaceBetConsumer extends Core.BaseEventConsumers.PlaceBetConsumer {
    /**
     * @param {GameDefinition} definition
     * @param {GameData} gameData
     * @param {BaseEventPublisher} publisher
     * @param {GameStateManager} gameStateManager
     */
    constructor(definition: GameDefinition, gameData: GameData, publisher: BaseEventPublisher, gameStateManager: GameStateManager) {
        super(definition, gameData, publisher)
        this.gameStateManager = gameStateManager;
    }

    private gameStateManager: GameStateManager;

    override consume(player: Player, payload: Payload): void {

        Object.assign(payload, {
            amount: payload.amount >> 0,
            freeBet: payload.freeBet ?? false,
            roundId: payload.roundId ?? this.gameStateManager.roundId,
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

        this.upsertPlayerToGameState(player, payload);

        this.adjustBetTracks(player.profile.name, payload);
  
        this.gameStateManager.ingame[name].betQueue.push({ player, payload});
    }

    adjustBetTracks(name: string, bet: Payload) {
        const { betChoice, amount } = bet;
        if (this.gameStateManager.ingame?.[name]) {
            const playerInGame = this.gameStateManager.ingame[name];

            playerInGame.betTracks[betChoice]  = (playerInGame.betTracks[betChoice] ?? 0) + amount;
        }

    }

    upsertPlayerToGameState(player: any, payload: any) {
        const name = player.profile.name;

        if (!this.gameStateManager.ingame[name]) {
            const newPlayer = new PlayerInGame({
                name: player.profile.name,
                currency: player.session.currencyName,
                system: player.session.system,
                betTracks: {},
                betQueue: [],
                clientSeed: payload.clientSeed,
                operatorId: player.session.operatorId,
            });

            this.gameStateManager.ingame[name] = newPlayer;
        }
    }
}