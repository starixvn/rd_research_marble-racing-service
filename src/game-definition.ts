import { Duration, GameSettings } from "sc-game-base/src/core/game-definition";
import { TableGameDefinition } from "sc-game-base/src/table";

export default class MarbleRacingGameDefinition extends TableGameDefinition {
    declare durations: Duration;

    constructor(
        gameSetting: GameSettings,
        generateResult: Function,
        settle: Function,
        generateResultForHash: Function) {
        super(
            gameSetting,
            generateResult,
            settle,
            generateResultForHash
        );
    }
}