import mongoose, { ObjectId } from "mongoose";
import { IS_DEV_ENV } from "../constants/is-dev-env";

export enum Candidate {
    HOME = 0,
    AWAY = 1
}

export type MatchType  ={ 
    id?: number;
    home: string;
    away: string;
    winner?: Candidate 
}

export interface ITourament {
    _id: ObjectId;
    code: string;
    matches: MatchType[];
    currentMatch: number;
    ended: boolean;
    time: Date;
}

const Schema = new mongoose.Schema<ITourament>({
   code: { type: String, required: true },
   matches: { type: [Object], required: true },
   currentMatch: { type: Number, default: 0 },
   ended: { type: Boolean, default: false },
   time: { type: Date, default: () => new Date() },
});

const modelName = IS_DEV_ENV 
    ? "marbleracing_dev_touraments"
    : "marberacing_touraments";
    
const Tourament = mongoose.model(modelName, Schema);

export default Tourament;
