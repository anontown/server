import { MongoClient } from 'mongodb';
import { Config } from './config';
import * as es from 'elasticsearch';

export const DB = (async () => {
    let db = await MongoClient.connect(Config.db.url);
    console.log(`db:connect`);
    if (Config.db.auth !== null) {
        await db.authenticate(Config.db.auth.user, Config.db.auth.pass);
        console.log(`db:auth`);
    }
    return db;
})();

export const ESClient = new es.Client({ host: Config.es.host, log: 'error' })