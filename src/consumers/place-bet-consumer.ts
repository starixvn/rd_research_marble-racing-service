import { Core } from "sc-game-base";
import {  GameData, GameDefinition } from "sc-game-base/src/core";
import { BaseEventPublisher } from "sc-game-base/src/core/event-publishers";
import { GameStateManager, Payload, Player, PlayerInGame } from "../game-state";
import { helpers } from "sc-common";




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

    composeBetAmountValidationCriteria(player: any, betChoice: string, amount: number, freeBet: boolean): { failure: boolean; notice: string; }[] {
        const settings = this.gameStateManager.currencyGroupGames.find((x) => x.groupId.toString() === player.session.currencyGroupId);
        const configs = this.gameStateManager.gameConfigs;
        const { betTracks } = this.gameStateManager.ingame[player.profile.name] || { betTracks: {} };
        const totalAmount = this.definition.choices.reduce((total, choice) => total + (betTracks[choice] || 0), 0) + amount;
        const minBet = Math.max(player.profile.minBet, settings.minBet);
        const maxBet = Math.min(player.profile.maxBet, settings.maxBet);
        const maxBetPerChoice = Math.min(player.profile.maxBet, settings.maxBetPerChoices[betChoice]);

        return [
            {
                failure: freeBet && !configs.enableFreeBet,
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet),
            },
            {
                failure: amount > maxBetPerChoice || betTracks[betChoice] + amount > maxBetPerChoice,
                notice: this.getNoticeObj(helpers.noticeHelper.maxBetForChoice, { maxBet: maxBetPerChoice }),
            },
            {
                failure: amount < minBet,
                notice: this.getNoticeObj(helpers.noticeHelper.minBet, { minBet }),
            },
            {
                failure: amount > maxBet,
                notice: this.getNoticeObj(helpers.noticeHelper.maxBet, { maxBet }),
            },
            {
                failure: totalAmount > maxBet,
                notice: this.getNoticeObj(helpers.noticeHelper.maxBet, { maxBet }),
            },
        ];
    }

    composeBettingTimeValidationCriteria(roundId: number): { failure: boolean; notice: string; }[] {
        const configs = this.gameStateManager.gameConfigs;

        return [
            {
                failure: !configs.enabled,
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet),
            },
            {
                failure: roundId !== this.gameStateManager.roundId,
                notice: this.getNoticeObj(helpers.noticeHelper.invalidBet, { gameRoundId: roundId }),
            },
            {
                failure:
                    this.gameStateManager.remainingTime < this.definition.durations.lockingBet ||
                    this.gameStateManager.remainingTime >= this.definition.durations.placingBets,
                notice: this.getNoticeObj(helpers.noticeHelper.placeBetNextRound),
            },
        ];
    }

    composeHedgeBetValidationCriteria(betChoice: string, player: any): { failure: boolean; notice: string; }[] {
        const { betTracks } = this.gameStateManager.ingame[player.profile.name] || { betTracks: {} };
        const hedgeBetGroup = this.definition.hedgeBetGroups.find((group) => group.includes(betChoice));

        const isInvalid =
            hedgeBetGroup &&
            (Object.keys(betTracks).some((betKey) => betTracks[betKey] && hedgeBetGroup.includes(betKey) && betKey !== betChoice) ?? false);

        return [
            {
                failure: isInvalid ?? false,
                notice: this.getNoticeObj(helpers.noticeHelper.disallowHedgeBet, { hedgeBetGroup }),
            },
        ];
    }
}