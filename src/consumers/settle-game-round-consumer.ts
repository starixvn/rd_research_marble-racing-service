import { Table } from "sc-game-base";
import { OddsType } from "../match-configs";
import { SettlementResultType } from "../models/rounds";
import type TournamentConsumer from "./tournament-consumer";
import { GameStateManager, MarbleFootballGameStateManager } from "../game-state";

export default class SettleGameRoundConsumer extends Table.EventConsumers.TableSettleGameRoundConsumer {
    declare gameStateManager: MarbleFootballGameStateManager;
    tournamentConsumer: TournamentConsumer;

    constructor(container: any) {
        super(container);

        this.tournamentConsumer = container.tournamentConsumer;
        this.gameStateManager = container.gameStateManager;
    }

    override async settleRound() {
        const result = this.generateResult();
        const settlementResult = this.definition.settle(result);
        const { roundId, exchangeRates } = this.gameStateManager;
        try {
            const newRound = await this.roundsRepository.create({
                id: roundId,
                result,
                settlementResult,
                time: new Date(),
                exchangeRateId: exchangeRates.exId,
            });
    
            if (newRound) {
                this.roundResultPublisher.publishRoundResult({result, settlementResult, roundId});
    
                const finish = {
                    settlementResult,
                    result,
                    roundId: newRound.id,
                    time: newRound.time,
                };
    
                this.gameStateManager.roundId = finish.roundId + 1;
    
                await this.settleBets(finish);
    
                this.roundResultPublisher.publishWinners(roundId, this.gameStateManager.winningPlayers);
            }
            
            await this.updateTournament(result);
        } catch (er) {
            console.log(er);
        }
        
    }

    async updateTournament(result: any) {
        const settlementResult = this.definition.settle(result);
        const homeWins = settlementResult.home;

        await this.tournamentConsumer.updateMatchResult(homeWins);
    }

    override calculateBetResult(settlementResult: SettlementResultType, bet: any, odds: OddsType) {
        const betResult = Object.entries(settlementResult).reduce(
            (result, [choice, win]) => {
                const betAmount = bet[choice] ?? 0;
                let originalOdds = (odds as any)[choice] || 1;

                const effectiveOdds = bet.freeBet ? originalOdds - 1 : originalOdds;
                const winAmount = win ? betAmount * effectiveOdds : 0;

                result.totalBetAmount += betAmount;
                result.totalWin += winAmount;
                (result.winningByChoices as any)[choice] = winAmount;

                if (winAmount > 0) {
                    result.netWin += winAmount - betAmount;
                } else {
                    result.totalLost += betAmount;
                }

                return result;
            },
            {
                totalBetAmount: 0,
                totalWin: 0,
                netWin: 0,
                totalLost: 0,
                winningByChoices: {},
            }
        );

        betResult.totalWin = parseFloat(betResult.totalWin.toFixed(2));
        betResult.netWin = parseFloat(betResult.netWin.toFixed(2));

        return betResult;
    }

    generateResult() {
        if (this.gameStateManager.result && Object.entries(this.gameStateManager.result).length !== 0) {
            return this.gameStateManager.result;
        } else {
            const resultFromAdmin = this.gameStateManager.settlementResultFromAdmin;
            const { randomMode } = this.gameStateManager.gameConfigs;
            return this.gameStateManager.roundId === resultFromAdmin.roundId ? resultFromAdmin.result : this.definition.generateResult(randomMode);
        }
    }

    async settleBets({ settlementResult, roundId, time }: { settlementResult: any, roundId: any, time: any }) {
        const bets = await this.queryBets(roundId);

        if (bets && bets.length) {
            await Promise.all(
                bets.map(async (bet: any) => {
                    const odds = bet.odds ?? this.gameStateManager.gameConfigs.odds;

                    const betResult = this.calculateBetResult(settlementResult, bet, odds);

                    bet.betwin = betResult.totalWin;
                    bet.paid = true;

                    await bet.save();
                    await this.callEndGame(bet, roundId, time, betResult);

                    this.captureBetResult(bet.uid, betResult, bet.rate);
                    await this.userBetResultPublisher.publish(bet.uid, betResult);
                })
            );
        }
    }
}
