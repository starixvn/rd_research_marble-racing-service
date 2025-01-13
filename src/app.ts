import { Core } from "sc-game-base";
import appConfigs from "./app-configs";
import ContainerRegistry from "./container-registry";
import gameData from "./game-data";
import MarbleRacingGameDefinition from "./game-definition";
import gameSettings from "./game-settings";

const run = async () => {
    const definition = new MarbleRacingGameDefinition(
        gameSettings,
        () => {},
        () => {},
        () => {}
    )
    const container = new ContainerRegistry().register(appConfigs, definition, gameData);
    const app = new Core.BaseGameApp(gameSettings.name, appConfigs);
    await app.run();
    await app.startGame(container);
}

run();