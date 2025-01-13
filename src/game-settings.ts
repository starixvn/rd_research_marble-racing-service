import { BET_CHOICES } from "./constants/bet-choices";

export default {
    id: 104,
    name: "marblefootball",
    configName: "marblefootball",
    durations: {
        wholeRound: 151,
        startingRound: 141,
        placingBets: 136,
        lockingBet: 109,
        streamingVideo: 108,
    },
    choices: Object.values(BET_CHOICES),
    choicesMapper: { home: 1, away: 2 },
    hedgeBetGroups: [
        [BET_CHOICES.home, BET_CHOICES.away],
    ],
    provablyFair: false,
    historyPageSize: 8,
    defaultBetTracks: {},
    botSettings: {
        ratio: { mainOpts: 100 },
        mainOpts: [BET_CHOICES.home, BET_CHOICES.away],
    },
};
