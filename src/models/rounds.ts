import mongoose from "mongoose";
import { BET_CHOICES } from "../constants/bet-choices";
import { IS_DEV_ENV } from "../constants/is-dev-env";
import { MatchType } from "./touraments";


export type ResultType = {
    touramentId?: mongoose.Types.ObjectId;
    code: string;
    video: string;
    timeline?: number[];
}

const resultSchema = new mongoose.Schema<ResultType>(
    {
        touramentId: { type: mongoose.Schema.Types.ObjectId },
        code: { type: String },
        video: { type: String }
    }, 
    { _id: false }
);


const matchSchema = new mongoose.Schema<MatchType>(
    {
        home: { type: String }, 
        away: { type: String }
    }, 
    { _id: false}
);

export type SettlementResultType = {
    [key in keyof typeof BET_CHOICES]: boolean;
}

const settlementResultSchema = new mongoose.Schema<SettlementResultType>(
    {
        away: { type : Boolean },
        home: { type: Boolean }
    },
    { _id: false }
)

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

const modelName = IS_DEV_ENV
    ? "marbleracing_dev_rounds"
    : "marbleracing_rounds";

const Round = mongoose.model(modelName, RoundSchema);

export default Round;