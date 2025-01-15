import gameSetting from "./game-settings";

const game = {
    id: gameSetting.id,
    name: gameSetting.name,
};

const currencyData = { code: "USD", name: "$US" };

const socketOptionsFunc = (port) => {
    return {
        socketUri: `http://localhost:${port}/user/${gameSetting.name.toLowerCase()}`,
        gameName: game.name,
        proxyRoute: "/socket.io",
    };
};

const gameConfig = {
    type: 0,
    name: gameSetting.name.toLowerCase(),
    minBet: 1,
    maxBet: 3000,
    maxBetPerChoices: {
        big: 3000,
        small: 3000,
        specific1: 3000,
        specific2: 3000,
        specific3: 3000,
        specific4: 3000,
        specific5: 3000,
        specific6: 3000,
    },
    odds: { big: 1.96, small: 1.96, single: 2, double: 3.5, triple: 6 },
    margin: [],
    botenabled: false,
    hour_maxbot: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    bot_maxbet: 1000,
    choices_maxbet: {
        big: 3000,
        small: 3000,
        specific1: 3000,
        specific2: 3000,
        specific3: 3000,
        specific4: 3000,
        specific5: 3000,
        specific6: 3000,
    },
};

const pfResults = [];

const roundsData = [{
    "id": 1,
    "result": {
      "firstHalf": "HAHA",
      "secondHalf": "HAHA",
      "firstHalfVideo": "3ff0610ea6b1620a3136fb41df7c2402e77fad6dfbecd88dc3493c3501ac82f7",
      "secondHalfVideo": "3ff0610ea6b1620a3136fb41df7c2402e77fad6dfbecd88dc3493c3501ac82f7",
      "overUnderValue": 4.5,
      "homeWinsOnDraw": true,
      "tournamentId": "67516aadda8b0949a41c9af5"
    },
    "settlementResult": {
      "home": false,
      "away": false,
      "draw": true,
      "over": true,
      "under": false,
      "odd": false,
      "even": true
    },
    "time": new Date("12/20/2014 04:11"),
    "exchangeRateId": 2128
  }
];

const tournamentData = {
    "matches": [
        {
            "home": "JUV",
            "away": "ATM"
        },
        {
            "home": "ARS",
            "away": "LIV"
        },
        {
            "home": "PSG",
            "away": "BVB"
        },
        {
            "home": "LEV",
            "away": "RMA"
        },
        {
            "home": "ATA",
            "away": "SLB"
        },
        {
            "home": "FCB",
            "away": "MCI"
        },
        {
            "home": "INT",
            "away": "MIL"
        },
        {
            "home": "AVL",
            "away": "BAR"
        },
        {
            "home": "",
            "away": ""
        },
        {
            "home": "",
            "away": ""
        },
        {
            "home": "",
            "away": ""
        },
        {
            "home": "",
            "away": ""
        },
        {
            "home": "",
            "away": ""
        },
        {
            "home": "",
            "away": ""
        },
        {
            "home": "",
            "away": ""
        }
    ],
    "currentMatch": 0,
    "ended": false,
    "code": "UCL",
}

const userBetData = (uid) => {
    return [];
};

const userBetLogData = (uid) => {
    return [];
};

const promotions = [];

export { currencyData, game, gameConfig, pfResults, promotions, roundsData, socketOptionsFunc, tournamentData, userBetData, userBetLogData };

