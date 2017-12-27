import * as es from "elasticsearch";
import { MongoClient } from "mongodb";
import { Config } from "./config";
import { Logger } from "./logger";

export const DB = (async () => {
    const db = await MongoClient.connect(Config.db.url);
    Logger.system.info(`db:connect`);
    if (Config.db.auth !== null) {
        await db.authenticate(Config.db.auth.user, Config.db.auth.pass);
        Logger.system.info(`db:auth`);
    }
    return db;
})();

export const ESClient = new es.Client({ host: Config.es.host, log: "error" });
