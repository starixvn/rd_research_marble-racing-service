import { authenticationHelpers } from "sc-game-base/src/core/helpers";

const actions = {
    signInGame: "/gameBackend/signInGame",
};

export const signInGame = async (userServiceUrl: string, params: any, options?: any) => {
    return authenticationHelpers.post(`${userServiceUrl}${actions.signInGame}`, params, options);
};
