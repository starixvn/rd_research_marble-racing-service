import { logger } from "sc-common";
import { PlaceBetConsumer, UserSignInConsumer } from "sc-game-base/src/core/event-consumers";
import { UserSignInPublisher } from "sc-game-base/src/core/event-publishers";
import { RoundQuery } from "sc-game-base/src/core/query-apis";
import { BaseSocketRouter } from "sc-game-base/src/core/routers";
import { PlayGamePermissionValidator } from "sc-game-base/src/core/validators";
import { Socket } from "socket.io";
import { InGameConsumer, UserDisconnectConsumer } from "../consumers";
import TestConsumer from "../consumers/test-consumer";
import GameData from "../game-data";
import GameDefinition from "../game-definition";
import { HistoryQuery } from "../query-apis";
export default class SocketRouter extends BaseSocketRouter {

    testConsumer: TestConsumer;

    constructor({
        definition,
        gameData,
        userSignInConsumer,
        inGameConsumer,
        placeBetConsumer,
        userDisconnectConsumer,
        userSignInPublisher,
        historyQuery,
        logService,
        playGamePermissionValidator,
        roundQuery,
        testConsumer,
    }: {
        definition: GameDefinition;
        gameData: GameData;
        userSignInConsumer: UserSignInConsumer;
        inGameConsumer: InGameConsumer;
        placeBetConsumer: PlaceBetConsumer;
        userDisconnectConsumer: UserDisconnectConsumer;
        userSignInPublisher: UserSignInPublisher;
        historyQuery: HistoryQuery;
        logService: typeof logger;
        playGamePermissionValidator: PlayGamePermissionValidator;
        roundQuery: RoundQuery;
        testConsumer: TestConsumer
    }) {
        super({
            definition,
            gameData,
            userSignInConsumer,
            inGameConsumer,
            placeBetConsumer,
            userDisconnectConsumer,
            userSignInPublisher,
            historyQuery,
            logService,
            playGamePermissionValidator,
            roundQuery,
        });

        this.testConsumer = testConsumer;
    }

    init(socketClient: Socket): void {
        super.init(socketClient);
        this.socketClient.on("test", this.handleTest.bind(this));
    }

    handleTest(payload: { message: string }) {
        this.testConsumer.consume(this.socketClient, payload)
    }
}