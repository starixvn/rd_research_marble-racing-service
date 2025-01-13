import { BaseEventPublisher } from "sc-game-base/src/core/event-publishers";

export default class TestPublisher extends BaseEventPublisher {
    publish(data: {
        message: string;
    }) {
        this.publishToAllUsers({
            event: 'test',
            data
        })
    }
}