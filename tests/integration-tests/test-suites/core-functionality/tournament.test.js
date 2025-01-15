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

describe("when in a tournament", () => {

    let client;
    beforeAll(async () => {
        await createMockTournamentData();
    })

    beforeEach(async () => {
        client = new GameClientDriver(socketOptions, initUserSession(normalUser));
        await signInClient(client);
    });

    afterEach(() => {
        client.close();
        client = null;
    });

    it("winning team go to the round afterward", async () => {
        // arrange

        // act

        // assert
    });
});