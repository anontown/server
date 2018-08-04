import * as es from "elasticsearch";
import { MongoClient } from "mongodb";
import { Config } from "./config";
import { Logger } from "./logger";

export const DB = (async () => {
    const db = await MongoClient.connect(Config.db.url);
    Logger.system.info("db:connect");
    return db;
})();

export const ESClient = new es.Client({ host: "http://" + Config.es.host, log: "error" });
