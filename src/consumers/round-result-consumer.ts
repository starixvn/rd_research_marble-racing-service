import { RoundResultConsumer as RoundResultConsumerBase } from "sc-game-base/src/core/event-consumers";
import { encrypt } from "sc-game-base/src/core/helpers/crypto-helper";
import GameData from "../game-data";
import { resultHelper } from "../helpers";
import type TournamentConsumer from "./tournament-consumer";
import { MarbleFootballGameStateManager } from "../game-state";
export default class RoundResultConsumer extends RoundResultConsumerBase {
    declare gameData: GameData;
    tournamentConsumer: TournamentConsumer;
    gameStateManager: MarbleFootballGameStateManager;

    constructor(container: any) {
        super(
            container.gameData,
            container.definition,
            container.roundResultPublisher,
            container.resultsRepository,
            container.provablyFairConsumer
        );

        this.tournamentConsumer = container.tournamentConsumer;
        this.gameStateManager = container.gameStateManager;
    }

    override getDataForGenerateResult() {
        const { randomMode } = this.gameStateManager.gameConfigs;
        return { randomMode };
    }

    override async generateResult() {
        await super.generateResult();

        const tournament = await this.tournamentConsumer.getCurrentTournament();
        this.gameStateManager.result.tournamentId = tournament._id;
        await this.createResultRecord();
    }

    override generateResultFromAdmin() {
        const { roundId, settlementResultFromAdmin: resultFromAdmin } = this.gameStateManager;

        if (roundId === resultFromAdmin.roundId) {
            this.gameStateManager.result = resultHelper.generateResultFromAdminRawResult(resultFromAdmin.result);
            return true;
        }

        return false;
    }

    async createResultRecord() {
        await this.resultsRepository.create({
            roundId: this.gameStateManager.roundId,
            encryptedResult: encrypt(JSON.stringify(this.gameStateManager.result)),
        });
    }
}
