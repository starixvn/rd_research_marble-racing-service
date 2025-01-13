import { AwilixContainer } from "awilix";
import { Table } from "sc-game-base";
export default class ContainerRegistry extends Table.TableContainerRegistry {
    register(appConfigs: any, definition: any, gameData: any): AwilixContainer<any> {
        super.register(appConfigs, definition, gameData);

        return this.container;
    }

    registerModels() {
        super.registerModels();

        this.container.register({

        });
    }

    registerCrons() {
        super.registerCrons();

        this.container.register({

        });
    }

    registerConsumers() {
        super.registerConsumers();

        this.container.register({

        });
    }

    registerPublishers() {
        super.registerPublishers();

        this.container.register({
        });
    }

    registerApis() {
        super.registerApis();

        this.container.register({
        });
    }
}
