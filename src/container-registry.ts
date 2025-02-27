import { asClass, asValue, AwilixContainer } from "awilix";
import { Table } from "sc-game-base";
import {
    InGameConsumer,
    RoundResultConsumer,
    SettleGameRoundConsumer,
    TournamentConsumer,
    UnsettledRoundConsumer,
    UserDisconnectConsumer,
    PlaceBetConsumer as ManagedPlaceBetConsumer
} from "./consumers";

import TestConsumer from "./consumers/test-consumer";
import { Bot, GameCron, ProcessBetQueue } from "./crons";
import { betLogs, bets, results, rounds, tmpBets, tournaments } from "./models";
import { RunningRoundInfoPublisher } from "./publishers";
import TestPublisher from "./publishers/test-publisher";
import { HistoryQuery } from "./query-apis";
import SocketRouter from "./routers/socket-router";
import { MarbleFootballGameStateManager } from "./game-state";
import RoundIdConsumer from "./consumers/round-id-consumer";
import UserSignInConsumer from "./consumers/user-sign-in-consumer";
import PlayGamePermissionValidator from "./validators/play-game-permission-validator";
import { gameStatusPublisher, placeBetPublisher } from "../tests/unit-tests/global-stubs";
import PlaceBetPublisher from "./publishers/place-bet-publisher";
import BaseEventPublisher from "./publishers/base-event-publiser";
import GameStatusPublisher from "./publishers/game-status-publisher";

export default class ContainerRegistry extends Table.TableContainerRegistry {
    register(appConfigs: any, definition: any, gameData: any): AwilixContainer<any> {
        super.register(appConfigs, definition, gameData);
        this.container.register({
            gameStateManager: asClass(MarbleFootballGameStateManager).singleton(),
        });

        return this.container;
    }

    registerModels() {
        super.registerModels();

        this.container.register({
            roundsRepository: asValue(rounds),
            betsRepository: asValue(bets),
            tempBetsRepository: asValue(tmpBets),
            betLogsRepository: asValue(betLogs),
            tournamentRepository: asValue(tournaments),
            resultsRepository: asValue(results),
        });
    }

    registerCrons() {
        super.registerCrons();

        this.container.register({
            bot: asClass(Bot).singleton(),
            gameCron: asClass(GameCron).singleton().proxy(),
            processBetQueue: asClass(ProcessBetQueue).singleton().proxy(),
        });
    }

    registerConsumers() {
        super.registerConsumers();
        this.container.register({
            userDisconnectConsumer: asClass(UserDisconnectConsumer).singleton(),
            inGameConsumer: asClass(InGameConsumer).singleton(),
            tournamentConsumer: asClass(TournamentConsumer).singleton().proxy(),
            roundResultConsumer: asClass(RoundResultConsumer).singleton().proxy(),
            unsettledRoundConsumer: asClass(UnsettledRoundConsumer).singleton().proxy(),
            settleGameRoundConsumer: asClass(SettleGameRoundConsumer).singleton().proxy(),
            testConsumer: asClass(TestConsumer).singleton().proxy(),
            placeBetConsumer: asClass(ManagedPlaceBetConsumer).singleton(),
            roundIdConsumer: asClass(RoundIdConsumer).singleton(),
            userSignInConsumer: asClass(UserSignInConsumer).singleton(),
        });
    }

    registerPublishers() {
        super.registerPublishers();

        this.container.register({
            publisher: asClass(BaseEventPublisher).singleton(),
            runningRoundInfoPublisher: asClass(RunningRoundInfoPublisher).singleton(),
            testPublisher: asClass(TestPublisher).singleton().proxy(),
            placeBetPublisher: asClass(PlaceBetPublisher).singleton(),
            gameStatusPublisher: asClass(GameStatusPublisher).singleton()
        });
    }

    registerApis() {
        super.registerApis();

        this.container.register({
            historyQuery: asClass(HistoryQuery).singleton(),
        });
    }

    registerRouters(): void {
        super.registerRouters();
        this.container.register({
            socketRouter: asClass(SocketRouter).proxy(),
        })
    }

    registerValidators(): void {
        super.registerValidators()
        this.container.register({
            playGamePermissionValidator: asClass(PlayGamePermissionValidator).singleton(),
        })
    }
}
