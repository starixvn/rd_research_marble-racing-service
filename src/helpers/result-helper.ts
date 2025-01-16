import Chance from "chance";
import crypto from "crypto";
import { NUMBER_OF_MARBLES, NUMBER_OF_VIDEOS, NUMBER_OF_WINNER_MARLBE as NUMBER_OF_WINNER_MARBLES } from "../constants";
import { ResultType, SettlementResultType } from "../models/rounds";
import { shuffle } from "./shuffle";

export const generateResult = (): ResultType => {

    const result = generateRacingLapResult(NUMBER_OF_MARBLES);
    const videoInfo = getVideoInfoFromResult(result);

    return {
        result,
        ...videoInfo,
    };
};

export const generateResultFromAdminRawResult = (roundResult: ResultType): ResultType => {
    const result = roundResult.result ;
    const videoInfo = getVideoInfoFromResult(result);

    return {
        result,
        ...videoInfo
    };
};

export const getSettlementResult = (roundResult: ResultType): SettlementResultType => {
    const winningMarbles = roundResult
        .result
        .slice(0, NUMBER_OF_WINNER_MARBLES)
        .split("");

    const homeWinCount = winningMarbles.filter(item => Number(item) % 2 !== 0).length;
    const awayWinCount = winningMarbles.length - homeWinCount;

    return {
        home: homeWinCount > awayWinCount,
        away: homeWinCount < awayWinCount,
    };
};

export const generateRawResultForHash = () => {};

const getVideoInfoFromResult = (result: string) => {
    const resultVideoName = generateVideoName(result);

    return {
        resultVideoName
    };
};

export const generateVideoName = (result: string, videoDefault = false, ignoredVideo = "") => {
    const chance = new Chance();
    const numberOfVideos = NUMBER_OF_VIDEOS[result] || 1;
    let videoIndex = videoDefault ? 0 : chance.integer({ min: 1, max: numberOfVideos }) - 1;
    let videoName = crypto.createHash("sha256").update(`${result}-${videoIndex}`).digest("hex");

    if (videoName === ignoredVideo && !videoDefault) {
        videoIndex = (videoIndex + 1) % numberOfVideos;
        videoName = crypto.createHash("sha256").update(`${result}-${videoIndex}`).digest("hex");
    }
    return videoName;
};

function generateRacingLapResult(numberOfMarbles: number) {
    // init the array
    const marblePool = Array.from(Array(numberOfMarbles).keys());
    const resultPool = shuffle(shuffle(marblePool));

    return resultPool.join("");
}

function loop(loopCount: number, callback: Function) {
    for (let i = 0; i < loopCount; i++) {
        callback();
    }
}