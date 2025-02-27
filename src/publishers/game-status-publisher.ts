import BaseEventPublisher from "./base-event-publiser";

export default class GameStatusPublisher extends BaseEventPublisher {
    publishDisableGameStatus() {
        const disabledMessage = this.gameStateManager.umMessages ?? {};
        const payload = { um: true, um_message: disabledMessage };

        this.publishToAllUsers(payload);
        this.publishToAllAdmins(payload);
    }

    publishEnablingGameStatus() {
        const { gameConfigs, remainingTime, roundId } = this.gameStateManager;
        const configs = {
            odds: gameConfigs.odds,
            originalOdds: gameConfigs.originalOdds,
            enableFreeBet: gameConfigs.enableFreeBet,
        };

        const realPlayers = Object.values(this.gameStateManager.realPlayers);
        realPlayers.forEach((realPlayer) => {
            const settings = this.gameStateManager.currencyGroupGames.find((x) => x.groupId.toString() === realPlayer.session.currencyGroupId);
            const payload = { gameConfigs: { ...configs, ...settings }, remainingTime, snr: true };
            realPlayer.socketClient && realPlayer.socketClient.emit(this.gameName, payload);
        });

        this.publishToAllAdmins({
            remainingTime,
            roundId,
            currencies: this.gameStateManager.currencies,
            exchangeRates: this.gameStateManager.exchangeRates,
        });
    }

    publishStartGame() {
        this.publishToAllUsers({
            remainingTime: this.gameStateManager.remainingTime,
            snr: true,
        });
        this.publishToAllAdmins({
            currencies: this.gameStateManager.currencies,
            exchangeRates: this.gameStateManager.exchangeRates,
        });
    }

    publishBoostedOdds() {
        if (this.gameStateManager.gameConfigs && this.gameStateManager.gameConfigs.boostedChoices) {
            this.publishToAllUsers({
                odds: { values: this.gameStateManager.gameConfigs.odds, boostedChoices: this.gameStateManager.gameConfigs.boostedChoices },
            });
        }
    }

    publishStartPlacingBetStatus() {
        this.publishToAllUsers({
            spb: true,
        });
    }

    publishEndPlacingBetStatus() {
        this.publishToAllUsers({
            epb: true,
        });
    }
}