import { Core } from "sc-game-base";
import { GameData } from "sc-game-base/src/core";
import { UserSignInPublisher } from "sc-game-base/src/core/event-publishers";
import GameManagementApiClientFactory, { getOrDefault } from "sc-game-base/src/core/game-management-api";
import { PlayGamePermissionValidator } from "sc-game-base/src/core/validators";
import { GameStateManager } from "../game-state";
import { signInGame as userServiceSignInGame } from "../helpers/sign-in-helper"
import { Socket } from "socket.io";
import { TableUserSignInConsumer } from "sc-game-base/src/table/event-consumers";
import { TableUserSignInPublisher } from "sc-game-base/src/table/event-publishers";
import { TableGameData, TableGameDefinition } from "sc-game-base/src/table";
import { Systems } from "sc-game-base/src/constants";

export default class UserSignInConsumer extends TableUserSignInConsumer {
    gameStateManager: GameStateManager;
    declare userSignInPublisher: TableUserSignInPublisher;

    constructor(
        definition: TableGameDefinition,
        gameData: TableGameData,
        userSignInPublisher: TableUserSignInPublisher,
        playGamePermissionValidator: PlayGamePermissionValidator,
        gameManagementApiClientFactory: GameManagementApiClientFactory,
        appConfigs: Object,
        gameStateManager: GameStateManager
    ) {
        super(definition, gameData, userSignInPublisher, playGamePermissionValidator, appConfigs, gameManagementApiClientFactory);
        this.gameStateManager = gameStateManager;
    }

    async consume(socketClient: Socket, payload: any): Promise<void> {
        if (payload?.system !== Systems.Mobi && payload?.system !== Systems.Mini) {
            const configs = this.gameStateManager.gameConfigs;
            const configuredlyDisabled = !configs || !configs.enabled;
            const disabled = configuredlyDisabled || this.gameStateManager.delayStartTime > 0;

            if (disabled) {
                return this.userSignInPublisher.publishUmNotice(socketClient, this.gameStateManager.umMessages);
            }
        }

        if (!payload)
            return this.handleUnauthorizedSignIn(socketClient)
        const params = {
            session: payload.ss,
            username: payload.username,
            browserUserAgent: socketClient.request.headers["user-agent"]
        }

        const signInGameResult = await userServiceSignInGame(this.appConfigs.userServiceSettings.url, params);

        const userSession = {
            ...signInGameResult,
            userId: signInGameResult.id,
            playerName: signInGameResult.memberName,
        };

        const userInfo = await getOrDefault(this.gameManagementApiClient.users.getUserInfo(userSession.userId), null);

        if (!userInfo) {
            return this.handleUnauthorizedSignIn(socketClient);
        }

        if (!this.playGamePermissionValidator.validate(userSession, socketClient)) return;

        await this.getUserBetLimit(userSession, userInfo, socketClient);

        Object.values(this.gameStateManager.realPlayers).forEach(realPlayer => {
            if (realPlayer.UID === userSession.userId && realPlayer.socketClient) {
                realPlayer.socketClient.disconnect(true);
                delete this.gameData.realPlayers[realPlayer.socketClient.id];
            }
        });
        
        this.handleSignInSuccess(socketClient, userInfo, userSession);   
    }

    handleSignInSuccess(socketClient: any, userInfo: any, userSession: any) {
        const userData = {
            UID: userSession.userId,
            profile: { name: userInfo.name, minBet: userInfo.minBet, maxBet: userInfo.maxBet },
            session: userSession,
            socketClient,
        };

        userSession.characterName = userInfo.name;
        this.gameStateManager.realPlayers[socketClient.id] = userData;

        socketClient.emit("signedIn");
    }
}