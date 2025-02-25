import { logger } from "sc-common";
import { UserSignInConsumer } from "sc-game-base/src/core/event-consumers";
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
import PlaceBetConsumer from "../consumers/place-bet-consumer";
import { GameStateManager } from "../game-state";
export default class SocketRouter extends BaseSocketRouter {

    testConsumer: TestConsumer;
    gameStateManager: GameStateManager;

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
        gameStateManager,
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
        testConsumer: TestConsumer,
        gameStateManager: GameStateManager
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
        this.gameStateManager = gameStateManager;
    }

    init(socketClient: Socket): void {
        super.init(socketClient);
        this.socketClient.on("test", this.handleTest.bind(this));
    }

    handleTest(payload: { message: string }) {
        this.testConsumer.consume(this.socketClient, payload)
    }

    verify(payload?: any): boolean {
        const realPlayer = this.gameStateManager.realPlayers[this.socketClient.id];

        if (realPlayer) return this.playGamePermissionValidator.validate(realPlayer.session, this.socketClient);
        this.userSignInPublisher.publishUnauthorizedMessage(this.socketClient);
        this.socketClient.disconnect(true);

        return false;
    }
    
    handlePlaceBet(payload: any) {
        try {
            if (!this.verify()) {
                return;
            }

            this.placeBetConsumer.consume(this.gameStateManager.realPlayers[this.socketClient.id], payload);
        } catch (error) {
            this.logService.logError(error);
        }
    }

}