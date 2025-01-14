import { GameClientDriver, normalUser } from "sc-game-service-integration-utils";
import appConfigs from "../../../../build/app-configs.IGT";
import { socketOptionsFunc } from "../../_stubs/test-data";
import { initUserSession } from "../../helper/helper";

const socketOptions = socketOptionsFunc(appConfigs.hostingPort);

const signInClient = async (client) => {
    const interval = setInterval(() => client.sendSignInEvent(), 500);
    await client.handleSignedInEvent();
    clearInterval(interval);
};


describe("when in game", () => {
    let client;

    beforeEach(async () => {
        client = new GameClientDriver(socketOptions, initUserSession(normalUser));
        await signInClient(client);
    });

    afterEach(() => {
        client.close();
        client = null;
    });

    it("should observe tourament", async () => {

        const ingameData = 
            await client.handleGameEvent((data) => data.tournament);
        expect(ingameData.tournament).toBeTruthy();
    });

});