import mongoose from "mongoose";
import { middlewares } from "sc-common";
import { createCurrencyGroupGames, createDummyCurrency, createDummyUsers, createExchangeRate, createGameConfig, createPartnerConfig } from "sc-game-service-integration-utils";
import appConfigs from "../../../build/app-configs.IGT";
import { currencyData, game, gameConfig } from "./test-data";



async function connectDatabase() {
    await middlewares
        .database
        .configureDatabase(
            mongoose, 
            appConfigs.database);
    
    await clearAllData();
}

async function clearAllData() {
    const collections = 
        await mongoose.connection.db.collections();
    
    for (const collection of collections) {
        await collection.drop();
    }
}

export async function createTestData() {
    await connectDatabase();
    await createExchangeRate();
    await createGameConfig(gameConfig);

    const operatorConfig = await createPartnerConfig(game.id);

    const currency = await createDummyCurrency(
        operatorConfig.partnerId,
        currencyData.code,
        currencyData.name
    );

    await createCurrencyGroupGames(
        currency.groupId,
        game.id,
        gameConfig
    );

    await createDummyUsers(currency);

    console.log("Create dummy user for testing successfully!");

    process.exit(0);
}

createTestData();