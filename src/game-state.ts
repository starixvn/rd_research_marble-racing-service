import { WinningStatus } from "sc-game-base/src/core/game-data";
import { RealPlayer } from "./game-data";
import { ResultType } from "./models/rounds";
import { ITournament } from "./models/tournaments";
import { Socket } from "socket.io";


export interface Player {
    UID: string;
    session: Session;
    profile: {
        name: string;
        minBet: number;
        maxBet: number;
    }
}

export interface Session {
    currencyId: string;
    currencyName: string;
    system: string;
    operatorId: string;
    currencyCode: string;
    multiplier: number;
    currencyGroupId: string;
    siteName: string;
}

export interface Payload {
    amount: number;
    freeBet: boolean;
    roundId: number;
    m: string;
    receivedTime: Date;
    betChoice: string;
    clientSeed: string;
}

export interface PlayerConstructorProps {
    name: string;
    currency: string;
    system: string;

    clientSeed: string;
    operatorId: string;
    betTracks: Record<BetChoice, number>;
    betQueue: Array<BetQueueItem>;
} 
type BetQueueItem = {
    player: Player,
    payload: Payload
}
type BetChoice = string;
type PlayerId = string;

class ManagedBetQueue {
    private _betQueue: Array<BetQueueItem> = []

    constructor(betQueue: Array<BetQueueItem> = []) {
        this._betQueue = betQueue;
    }

    public push(betQueueItem: BetQueueItem) {
        this._betQueue.push(betQueueItem);
    }

    public shift() {
        console.log("dequeued bet")
        const shiftedItem = this._betQueue.shift();
        return shiftedItem
    }

    public get length() {
        return this._betQueue.length;
    }
}

class ManagedBetTrack {
    private _betTracks: Record<BetChoice, number> = {};

    constructor(betTracks?: Record<BetChoice, number>) {
        if (!betTracks) return;
        this._betTracks = betTracks;
    }

    public get(key: string) {
        return this._betTracks[key];
    }

    public set(key: string, value: number) {
        console.log(`Bet track of  ${key} is set from ${this._betTracks[key]} to ${value}`)
        this._betTracks[key] = value;
    }

    public keys() {
        return Object.keys(this._betTracks);
    }

    public getBetTrack() {
        return this._betTracks;
    }
}

export type BetTracks = {
    [betChoice: string]: number
}

export class PlayerInGame {
    name: string;
    currency: string;
    system: string;
    clientSeed: string;
    operatorId: string;
    partnerId: string = "";
    private _betProcessing: boolean = false;

    private _betTracks: ManagedBetTrack = new ManagedBetTrack();
    private _betQueue: ManagedBetQueue = new ManagedBetQueue();
    private _ownBets: Record<string, number> = {}

    constructor({
        name,
        clientSeed,
        currency,
        operatorId,
        system,
        betTracks,
        betQueue,
    }: PlayerConstructorProps) {
        this.name = name;
        this.clientSeed = clientSeed;
        this.currency = currency;
        this.operatorId = operatorId,
        this.system = system;
        this._betTracks = new ManagedBetTrack(betTracks)
        this._betQueue = new ManagedBetQueue(betQueue);
    }

    public get betQueue() {
        return this._betQueue;
    }

    public get betTracks() {
        return this._betTracks.getBetTrack();
    }

    public set betTracks(value: Record<BetChoice, number>) {
        this._betTracks = new ManagedBetTrack(value);
    }

    public get betProcessing() {
        return this._betProcessing;
    }

    public set betProcessing(value: boolean) {
        this._betProcessing = value;
    }

    public get ownBets() {
        return this._ownBets;
    }

    public set ownBets(value: Record<string, number>) {
        this._ownBets = value;
    }
}

type PlayerInGameMap = {
    [playerId: PlayerId]: PlayerInGame
}

type ExchangeRateConfigList = {
    code?: Record<string, any>;
    exId?: string;
    _id?: string;
}

interface Currency {
    partnerId: string;
    name: string;
    code: string;
    multiplier: number;
    enabled: boolean;
    isTest: boolean;
    groupId: string;
    isUncountOnTotal: boolean;
}

export class GameStateManager {
    private _inGamePlayerDataMap: PlayerInGameMap = {}
    private _exchangeRates: ExchangeRateConfigList  = {}
    private _currencies: Currency[] = []
   
    private _totalBets: Record<string, number> = {};

    constructor() {}

    public get ingame() {
        return this._inGamePlayerDataMap;
    }

    public set ingame(value: PlayerInGameMap) {
        this._inGamePlayerDataMap = value;
    }

    public get exchangeRates() {
        return this._exchangeRates;
    }

    public set exchangeRates(value: ExchangeRateConfigList) {
        this._exchangeRates = value;
    }

    public get currencies() {
        return this._currencies;
    }

    public set currencies(value: Currency[]) {
        this._currencies = value;
    }

    public get totalBets() {
        return this._totalBets;
    }

    public set totalBets(value: Record<string, any>) {
        this._totalBets = value;
    }

    public realPlayers: { [playerId: string]: RealPlayer } = {}
    public roundId: number = -1;
    public gameConfigs: any = {}
    public disabled: boolean = true;
    public delayStartTime: number = 0;
    public umMessages = {};
    public remainingTime = 0;
    public result: Partial<ResultType> = {}
    public settlementResultFromAdmin: any = {}
    public winningPlayers: Record<string, WinningStatus> = {}
    public admins: Record<string, { socketClient: Socket }> = {};
    public currencyGroupGames: any[] = []
    public currencyGroups: any[] = []
    public partnerGameSiteExclusions: any[] = []
    public lastResultRecord: Partial<ResultType> = {}
}

export class MarbleFootballGameStateManager extends GameStateManager {
    private _liveStreamServer: string = "";
    private _tournament: ITournament = {} as ITournament;
    private _publishedTournament: ITournament = {} as ITournament;
    private _playerBetCount: Record<string, string[]> = {};

    public set liveStreamServer(value: string) {
        this._liveStreamServer = value;
    }

    public get liveStreamServer() {
        return this._liveStreamServer;
    }

    public get tournament() {
        return this._tournament;
    }

    public set tournament(value: ITournament) {
        this._tournament = value;
    }

    public get publishedTournament() {
        return this._publishedTournament;
    }

    public set publishedTournament(value: ITournament) {
        this._publishedTournament = value;
    }

    public get playerBetCount() {
        return this._playerBetCount;
    }

    public set playerBetCount(value: Record<string, string[]>) {
        this._playerBetCount = value;
    }
}