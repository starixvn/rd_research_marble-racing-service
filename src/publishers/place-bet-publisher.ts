import BaseEventPublisher from "./base-event-publiser";

export default class PlaceBetPublisher extends BaseEventPublisher {
    publishGameFailedBet(playerId: string, payload: any) {
        this.publishToUser(playerId, payload);
    }

    publishGeneralFailedBet(playerId: string, payload: any) {
        this.publishToUser(playerId, payload, "message");
    }

    publishSuccessBet(playerId: string, payload: any) {
        this.publishToUser(playerId, payload);
    }
}