import { GameDefinition } from "sc-game-base/src/core";
import { PlayGamePermissionValidator as BasePlayGamePermissionValidator} from "sc-game-base/src/core/validators";
import GameData from "../game-data";
import { UserSignInPublisher } from "sc-game-base/src/core/event-publishers";
import { GameStateManager, Session } from "../game-state";

export default class PlayGamePermissionValidator extends BasePlayGamePermissionValidator {
    gameStateManager: GameStateManager;

    constructor(definition: GameDefinition, gameData: GameData, userSignInPublisher: UserSignInPublisher, gameStateManager: GameStateManager) {
        super(definition, gameData, userSignInPublisher);
        this.gameStateManager = gameStateManager;
    }

    isValidCurrency(userSession: Session) {
        return this.gameStateManager.currencies.some(
            (currency) =>
                userSession.currencyName.toUpperCase() === currency.name.toUpperCase() && currency.partnerId === userSession.operatorId
        );
    }

    isValidGroupCurrency(userSession: Session) {
        return this.gameStateManager.currencyGroups.some((group) => group._id.toString() === userSession.currencyGroupId);
    }

    isOffered(userSession: Session) {
        return this.gameStateManager.currencyGroupGames.some((x) => x.groupId.toString() === userSession.currencyGroupId);
    }

    isSiteExcluded(userSession: Session) {
        const gameSiteExclusion = this.gameStateManager.partnerGameSiteExclusions.find((config) => config.partnerId === userSession.operatorId);

        const excludeSiteConfig = gameSiteExclusion?.value[this.definition.id];

        if(!excludeSiteConfig){
            return false;
        }

        return excludeSiteConfig.some((site: string) => site?.toLowerCase() === userSession.siteName.toLowerCase());
    }
}