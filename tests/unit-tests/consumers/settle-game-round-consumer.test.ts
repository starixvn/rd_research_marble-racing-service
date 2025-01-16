import { stub } from "jest-auto-stub";
import { Table } from "sc-game-base";
import SettleGameRoundConsumer from "../../../src/consumers/settle-game-round-consumer";
import GameData from "../../../src/game-data";
import GameDefinition from "../../../src/game-definition";
import { OddsType } from "../../../src/match-configs";
import {
    betsRepository,
    endGame,
    gameManagementApiClientFactory,
    roundResultPublisher,
    roundsRepository,
    tempBetsRepository,
    tournamentConsumer,
    userBetResultPublisher,
} from "../global-stubs";

describe("SettleGameRoundConsumer", () => {
    let settleGameRoundConsumer: SettleGameRoundConsumer;
    let mockContainer: any;
    const gameData = stub<GameData>();
    const definition = stub<GameDefinition>();

    beforeEach(() => {
        mockContainer = {
            gameData: gameData,
            tournamentConsumer: tournamentConsumer,
            definition,
            roundResultPublisher,
            userBetResultPublisher,
            endGame,
            roundsRepository,
            betsRepository,
            gameManagementApiClientFactory,
            tempBetsRepository,
        };

        // Create the instance
        settleGameRoundConsumer = new SettleGameRoundConsumer(mockContainer);
    });

    describe("constructor", () => {
        it("should initialize with the provided container", () => {
            // Assert
            expect(settleGameRoundConsumer.tournamentConsumer).toBe(tournamentConsumer);
            expect(settleGameRoundConsumer.gameData).toBe(gameData);
        });
    });

    describe("settleRound", () => {
        it("should call super.settleRound and updateTournament", async () => {
            // Arrange
            const superSettleRoundSpy = jest
                .spyOn(Table.EventConsumers.TableSettleGameRoundConsumer.prototype, "settleRound")
                .mockResolvedValue();

            const updateTournamentSpy = jest.spyOn(settleGameRoundConsumer, "updateTournament").mockResolvedValue();

            // Act
            await settleGameRoundConsumer.settleRound();

            // Assert
            expect(superSettleRoundSpy).toHaveBeenCalledTimes(1);
            expect(updateTournamentSpy).toHaveBeenCalledTimes(1);
        });
    });


    describe("calculateBetResult", () => {
        // Common test objects
        const defaultSettlementResult = {
            home: true,
            away: false,
        };

        const odds = { home: 2.0, away: 2.0 } as OddsType;

        it("should calculate bet result correctly for a winning bet", () => {
            // Arrange
            const settlementResult = { ...defaultSettlementResult, home: true };
            const bet = { home: 100, freeBet: false };

            // Act
            const result = settleGameRoundConsumer.calculateBetResult(settlementResult, bet, odds);

            // Assert
            expect(result.totalBetAmount).toBe(100);
            expect(result.totalWin).toBe(200);
            expect(result.netWin).toBe(100);
            expect((result.winningByChoices as any).home).toEqual(200);
        });

        it("should calculate bet result correctly for a losing bet", () => {
            // Arrange
            const settlementResult = { ...defaultSettlementResult };
            const bet = { away: 100, freeBet: false };

            // Act
            const result = settleGameRoundConsumer.calculateBetResult(settlementResult, bet, odds);

            // Assert
            expect(result.totalBetAmount).toBe(100);
            expect(result.totalWin).toBe(0);
            expect((result.winningByChoices as any).away).toEqual(0);
        });

        it("should handle free bets correctly", () => {
            // Arrange
            const settlementResult = { ...defaultSettlementResult, home: true };
            const bet = { home: 100, freeBet: true };

            // Act
            const result = settleGameRoundConsumer.calculateBetResult(settlementResult, bet, odds);

            // Assert
            expect(result.totalBetAmount).toBe(100);
            expect(result.totalWin).toBe(100);
            expect(result.netWin).toBe(0);
            expect((result.winningByChoices as any).home).toEqual(100);
        });

        it("should round results to 2 decimal places", () => {
            // Arrange
            const settlementResult = { ...defaultSettlementResult, home: true };
            const bet = { home: 100, freeBet: false };

            // Act
            const result = settleGameRoundConsumer.calculateBetResult(settlementResult, bet, odds);

            // Assert
            expect(result.totalWin).toBe(200);
            expect(result.netWin).toBe(100);
        });
    });
});
