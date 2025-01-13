import MarbleRacingGameDefinition from "./game-definition";
import gameSettings from "./game-settings";

const run = async () => {
    const definition = new MarbleRacingGameDefinition(
        gameSettings,
        () => {},
        () => {},
        () => {}
    )

}

run();