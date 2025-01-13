import { Socket } from "socket.io";
import TestPublisher from "../publishers/test-publisher";

export default class TestConsumer {
    testPublisher: TestPublisher

    constructor({
        testPublisher
    }: {
        testPublisher: TestPublisher
    }) {
        this.testPublisher = testPublisher
    }
    
    async consume(socketClient: Socket, data: {
        message: string;
    }) {
        socketClient.emit("test", data);
    }
}