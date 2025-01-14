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


describe("when observing a game", () => {
    let client;

    beforeEach(async () => {
        client = new GameClientDriver(socketOptions, initUserSession(normalUser));
        await signInClient(client);
    });

    afterEach(() => {
        client.close();
        client = null;
    });

    describe("on round start", () => {
        it("should see tourament", async () => {
            const interval = setInterval(() => client.sendInGameEvent(), 1000);
            const ingameData = 
                await client.handleGameEvent((data) => data.tournament);
            const remainingTime =
                await client.handleGameEvent((data) => data.remainingTime)
            console.log("Tourament Data : ", JSON.stringify(ingameData.tournament));
            console.log("Remaining Data : ", JSON.stringify(remainingTime.remainingTime));
            clearInterval(interval);
            expect(remainingTime.remainingTime).toEqual(3);
        });
    });
});