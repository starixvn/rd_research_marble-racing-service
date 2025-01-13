import { GameClientDriver, normalUser } from "sc-game-service-integration-utils";
import appConfigs from "../../../../build/app-configs.IGT";
import { socketOptionsFunc } from "../../_stubs/test-data";
import { initUserSession } from "../../helper/helper";

const socketOptions = socketOptionsFunc(appConfigs.hostingPort);

describe("when test", () => {

    let client;

    beforeEach(async () => {
        client = new GameClientDriver(socketOptions, initUserSession(normalUser)); 
    });

    afterEach(() => {
        client.close();
        client = null;
    });

    it("should receive test event accordingly", async () => {
        client.emit("test", {
            message: "ok"
        })
        const res = await client
            .waitForEvent("test");
        
        expect(res.message).toBe("ok")
    })
})