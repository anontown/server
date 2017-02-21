import { MongoClient } from 'mongodb';
import { Config } from './config';



export const DB = (async () => {
    let db = await MongoClient.connect(Config.db.url);
    await db.authenticate(Config.db.user, Config.db.pass);
    return db;
})();