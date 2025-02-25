import { RunningRoundInfoPublisher as RunningRoundInfoPublisherBase } from "sc-game-base/src/core/event-publishers";

import GameData from "../game-data";
import { getUserBetPercentage } from "../helpers/bet-percentage";
import BaseEventPublisher from "./base-event-publiser";
import { PlayerInGame } from "../game-state";

export default class RunningRoundInfoPublisher extends BaseEventPublisher {
    publish() {
        this.publishToAllUsers({ totalBets: this.gameData.totalBets });

        const inGame: Record<string, Partial<PlayerInGame>> = {};

        Object.values(this.gameStateManager.ingame).forEach((user) => {
            const { name, currency, ownBets, system, operatorId } = user;

            inGame[user.name ?? ""] = { name, currency, betTracks: ownBets, system, partnerId: operatorId, operatorId };
        });

        this.publishToAllAdmins({ inGame });

        this.publishBetPercentage();
    }

    publishBetPercentage() {
        const { playerBetCount } = this.gameData as GameData;
        const userBetPercentage = getUserBetPercentage(playerBetCount);

        const choices = Object.keys(playerBetCount);
        if (choices.some((choice) => playerBetCount[choice])) {
            this.publishToAllUsers({ userBetPercentage });
        }
    }
}
