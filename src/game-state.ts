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

export class Player {

    private _name: string;
    private _currency: string;
    private _system: string;
    private _clientSeed: string;
    private _operatorId: string;

    private _betTrack: Map<BetChoice, number> = new Map();
    private _betQueue: Array<BetQueueItem> = []
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

    public get betTrack() {
        return this._betTrack;
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
}