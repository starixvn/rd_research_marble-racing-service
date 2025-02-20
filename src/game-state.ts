export interface PlayerConstructorProps {
    name: string;
    currency: string;
    system: string;
    // betTracks: Map<string, number>;
    // betQueue: Array<{
    //     player: any,
    //     payload: any
    // }>;

    clientSeed: string;
    operatorId: string;
} 
type BetQueueItem = {
    player: any,
    payload: any
}
type BetChoice = string;
type PlayerId = string;

class ManagedBetQueue {
    private _betQueue: Array<BetQueueItem> = []

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
}

export type BetTracks = {
    [betChoice: string]: number
}

export class Player {
    private _name: string;
    private _currency: string;
    private _system: string;
    private _clientSeed: string;
    private _operatorId: string;

    private _betProcessing: boolean = false;

    private _betTracks: ManagedBetTrack = new ManagedBetTrack();
    private _betQueue: ManagedBetQueue = new ManagedBetQueue();
    constructor({
        name,
        clientSeed,
        currency,
        operatorId,
        system,
    }: PlayerConstructorProps) {
        this._name = name;
        this._clientSeed = clientSeed;
        this._currency = currency;
        this._operatorId = operatorId,
        this._system = system;
    }

    public get betQueue() {
        return this._betQueue;
    }

    public get betTracks() {
        return this._betTracks;
    }

    public get betProcessing() {
        return this._betProcessing;
    }

    public set betProcessing(value: boolean) {
        this._betProcessing = value;
    }
}

type InGamePlayerDataMapType = {
    [playerId: PlayerId]: Player
}

export class GameStateManager {
    private _inGamePlayerDataMap: InGamePlayerDataMapType = {}

    constructor() {}

    public get ingame() {
        return this._inGamePlayerDataMap;
    }

    public set ingame(value: InGamePlayerDataMapType) {
        this._inGamePlayerDataMap = value;
    }
}