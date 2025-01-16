import crypto from "crypto";
import { resultHelper } from "../../../src/helpers";
import { ResultType } from "../../../src/models/rounds";

jest.mock("chance", () => {
    return function () {
        return {
            integer: jest.fn().mockReturnValue(1),
            bool: jest.fn().mockReturnValue(true),
            weighted: jest.fn().mockImplementation((arr) => arr[0]),
        };
    };
});

jest.mock("../../../src/helpers/shuffle", () => ({
    shuffle: jest.fn((array) => array),
}));

jest.mock("../../../src/helpers/random-helper", () => ({
    getRandomIndexFromArray: jest.fn().mockReturnValue(0),
}));

jest.mock("../../../src/constants", () => ({
    NUMBER_OF_VIDEOS: {
        HHAAAH: 1,
        HAAAHA: 2,
    },
    POOL_SIZE: 10_000,
    NUMBER_OF_MARBLES: 6,
    NUMBER_OF_WINNER_MARBLES: 3
}));

describe("Result Helper", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("generateResult", () => {
        it("should generate random racing result sequence", () => {
            // Act
            const result = resultHelper.generateResult();
            // Assert
            expect(result.result).toBe("HAHAHA");
            expect(result.resultVideoName).toBeDefined();
        });
    });

    describe("getSettlementResult", () => {
        it("should calculate settlement result based on round result", () => {
            const roundResult: ResultType = {
                result: "HHAAHA",
                resultVideoName: "http://marble-football/watch?v=HHAAHA",
            };

            const settlementResult = resultHelper.getSettlementResult(roundResult);

            expect(settlementResult.home).toBe(true);
            expect(settlementResult.away).toBe(false);
        });
    });

    describe("generateResultFromAdminRawResult", () => {
        it("should generate a result from admin raw result", () => {
            const roundResult = {
                result: "HAHAHA"
            } as ResultType;

            const result = resultHelper.generateResultFromAdminRawResult(roundResult);

            expect(result.result).toBe("HAHAHA");
        });
    });


    describe("generateVideoName", () => {
        it("should generate a video name based on result", () => {
            const result = "HHAAAH";
            const videoName = resultHelper.generateVideoName(result);
            const expectedVideoName = crypto.createHash("sha256").update(`${result}-0`).digest("hex");
            expect(videoName).toBe(expectedVideoName);
        });

        it("should generate different video name when ignored video matches and number of videos is bigger than 1", () => {
            const result = "HAAAHA";
            const ignoredVideo = resultHelper.generateVideoName(result);
            const newVideo = resultHelper.generateVideoName(result, false, ignoredVideo);
            expect(newVideo).not.toBe(ignoredVideo);
        });

        it("should generate same video name when ignored video matches but number of videos is 1", () => {
            const result = "HHAAAH";
            const ignoredVideo = resultHelper.generateVideoName(result);
            const newVideo = resultHelper.generateVideoName(result, false, ignoredVideo);
            expect(newVideo).toBe(ignoredVideo);
        });
    });

    // describe("createScorePool", () => {
    //     it("should create a pool of scores based on config", () => {
    //         const config: HalfConfigType = {
    //             scoreRate: {
    //                 "1-0": 0.5,
    //                 "0-1": 0.5,
    //             },
    //         };

    //         const pool = resultHelper.createScorePool(config, 100);
    //         expect(pool).toHaveLength(100);
    //         expect(pool.filter((score) => score === "1-0").length).toBe(50);
    //         expect(pool.filter((score) => score === "0-1").length).toBe(50);
    //     });
});
