import { UnsettledRoundConsumer as UnsettledRoundConsumerBase } from "sc-game-base/src/core/event-consumers";
import GameData from "../game-data";
import { decrypt } from "sc-game-base/src/core/helpers/crypto-helper";
import { GameStateManager } from "../game-state";
import { getOrDefault } from "sc-game-base/src/core/game-management-api";
export default class UnsettledRoundConsumer extends UnsettledRoundConsumerBase {
    declare gameData: GameData;
    gameStateManager: GameStateManager;

    constructor(container: any) {
        super(container);
        const { gameStateManager } = container;
        this.gameStateManager = gameStateManager;
    }

    async proceed(): Promise<void> {
        if (!this.gameStateManager.lastResultRecord) return;

        await this.loadGameConfigs();
        
        const unsettledBets = await this.getUnsettledBets();
        await this.proceedUnsettledBets(unsettledBets);
        await this.settleGameRoundConsumer.settleRound();
    }

    override async generateResult(_unsettledBets: any) {
        const { lastResultRecord } = this.gameData;

        if (lastResultRecord && lastResultRecord.roundId === this.gameData.roundId) {
            this.gameData.result = JSON.parse(decrypt(lastResultRecord.encryptedResult));
        }
    }

    async loadGameConfigs(): Promise<void> {
        this.gameStateManager.gameConfigs = await getOrDefault(
            this.gameManagementApiClient.gameConfigs.getGameConfigs(this.definition.configName),
            this.gameStateManager.gameConfigs
        )
    }

    async getUnsettledBets(roundId: number = this.gameStateManager.roundId) {
        const playerBets = await this.betsRepository.find({ paid: false, roundId }).lean().exec();
        const botBets = this.tempBetsRepository
            ? await this.tempBetsRepository.find({ paid: false, roundId }).lean().exec()
            : [];

        return playerBets.concat(botBets);
    }
}
