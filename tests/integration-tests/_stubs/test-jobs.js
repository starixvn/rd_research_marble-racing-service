import { spawn } from "child_process";

export const startSetupDataProcess = (processId, overrideGameConfigs, onSetupDataDone) => {
    const setupDataProcess = spawn("node", [
        "--experimental-loader=extensionless",
        "./tests/integration-tests/_stubs/test-data-setup.js",
        "-pid",
        `${processId}`,
        `${JSON.stringify(overrideGameConfigs)}`,
    ]);

    setupDataProcess.stdout.on("data", (data) => {
        console.log(`stdout: ${data}`);
    });

    setupDataProcess.stderr.on("data", (data) => {
        console.log(`stderr: ${data}`);
    });

    setupDataProcess.on("close", (code) => {
        onSetupDataDone && onSetupDataDone();
        console.log(`child process exited with code ${code}`);
    });

    return setupDataProcess;
};

const STDIO_OPTIONS = {
    STDIN : "pipe",
    STDOUT: "pipe",
    STDERR: "pipe",
    IPC_CHANNEL: "ipc"
}

export const startServiceProcess = (processId, overrideAppConfigs, onServiceStarted) => {
    const serviceProcess = spawn("node", [
        "--experimental-loader=extensionless",
        "./tests/integration-tests/_stubs/game-service-app.js",
        "-pid",
        `${processId}`,
        `${JSON.stringify(overrideAppConfigs)}`,
        {
            stdio: [
                STDIO_OPTIONS.STDIN, 
                STDIO_OPTIONS.STDOUT, 
                STDIO_OPTIONS.STDERR,
                STDIO_OPTIONS.IPC_CHANNEL
            ],
        },
    ]);

    serviceProcess.stdout.on("data", (data) => {
        console.log(`stdout: ${data}`);

        if (data && data.includes("Express server started and running on")) {
            onServiceStarted && onServiceStarted();
        }
    });

    serviceProcess.stderr.on("data", (data) => {
        console.log(`stderr: ${data}`);
    });

    return serviceProcess;
};

export const startService = (processId, overrideGameConfigs = {}, overrideAppConfigs = {}) => {
    let processStartService;
    const JEST_ASSERT_WAITING_RESPONSE_TIMEOUT = 50000;
    beforeAll((done) => {
        startSetupDataProcess(processId, overrideGameConfigs, () => {
            console.log("done setup db");
            processStartService = startServiceProcess(processId, overrideAppConfigs, () => {
                console.log("start tests");
                done();
            });
        });
    }, JEST_ASSERT_WAITING_RESPONSE_TIMEOUT);

    afterAll(() => {
        processStartService.stdin.pause();
        processStartService.kill();
    });
};
