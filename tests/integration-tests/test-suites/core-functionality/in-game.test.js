import { GameClientDriver, normalUser } from "sc-game-service-integration-utils";
import appConfigs from "../../../../build/app-configs.IGT";
import gameSettings from "../../_stubs/game-settings";
import { socketOptionsFunc } from "../../_stubs/test-data";
import { initUserSession } from "../../helper/helper";

const socketOptions = socketOptionsFunc(appConfigs.hostingPort);

const signInClient = async (client) => {
    const interval = setInterval(() => client.sendSignInEvent(), 500);
    await client.handleSignedInEvent();
    clearInterval(interval);
};


describe("when game start", () => {
    let client;

    beforeEach(async () => {
        client = new GameClientDriver(socketOptions, initUserSession(normalUser));
        await signInClient(client);
    });

    afterEach(() => {
        client.close();
        client = null;
    });

    it("should see tourament on round start", async () => {
        const interval = setInterval(() => client.sendInGameEvent(), 1000);

        const ingameData = 
            // avoid accidentally get tournament property from 
            // events
            // which is not tournament event
            await client.handleGameEvent((data) => data.tournament && !data.roundId);
        const remainingTime =
            await client.handleGameEvent((data) => data.remainingTime);
        console.log("Tourament Data : ", JSON.stringify(ingameData));
        console.log("Remaining Data : ", JSON.stringify(remainingTime.remainingTime));
        clearInterval(interval);
        expect(remainingTime.remainingTime).toEqual(gameSettings.durations.startingRound);
    });

});