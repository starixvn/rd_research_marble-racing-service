import { Core } from "sc-game-base";
import { initAPIStub, stubUserService, subGameManagementService } from "sc-game-service-integration-utils";
import appConfigs from "../../../build/app-configs.IGT";
import ContainerRegistry from "../../../build/container-registry";
import GameData from "../../../build/game-data";
import GameDefinition from "../../../build/game-definition";
import gameSettings from "../_stubs/game-settings";

export const run = async () => {
    initAPIStub(appConfigs.apiSettings.apiUrl);

    const gameData = new GameData(gameSettings.durations.wholeRound);
    stubUserService(appConfigs);
    const definition = new GameDefinition(
        gameSettings,
        () => {},
        () => {},
        () => {}
    );
    subGameManagementService(appConfigs, definition);
    const container = new ContainerRegistry().register(appConfigs, definition, gameData);
    const app = new Core.BaseGameApp(gameSettings.name, appConfigs);
    await app.run();
    await app.startGame(container);
};

run();
