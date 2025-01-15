import mongoose from "mongoose";
import { BET_CHOICES, IS_DEV_ENV } from "../constants";
import { MatchType } from "./tournaments";

export type ResultType = {
    tournamentId?: mongoose.Types.ObjectId;
    result: string;
    resultVideoName?: string;
    videoTimeline?: number[];
};

const resultSchema = new mongoose.Schema<ResultType>(
    {
        tournamentId: { type: mongoose.Schema.Types.ObjectId },
        result: { type: String},
        resultVideoName: { type: String}
    },
    { _id: false }
);

const matchSchema = new mongoose.Schema<MatchType>(
    {
        home: { type: String },
        away: { type: String },
    },
    { _id: false }
);

export type SettlementResultType = {
    [key in keyof typeof BET_CHOICES]: boolean;
} 

const settlementResultSchema = new mongoose.Schema<SettlementResultType>(
    {
        home: { type: Boolean },
        away: { type: Boolean },
    },
    { _id: false }
);

export interface IRound {
    id: number;
    result: ResultType;
    settlementResult: SettlementResultType;
    match: MatchType;
    time: Date;
    exchangeRateId: number;
}

const RoundSchema = new mongoose.Schema<IRound>({
    id: { type: Number, required: true },
    result: resultSchema,
    settlementResult: settlementResultSchema,
    match: matchSchema,
    time: { type: Date, default: () => new Date() },
    exchangeRateId: { type: Number, required: true },
});

const modelName = IS_DEV_ENV ? "marblefootball_dev_rounds" : "marblefootball_rounds";
const Round = mongoose.model(modelName, RoundSchema);

export default Round;
