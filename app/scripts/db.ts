import { MongoClient } from 'mongodb';
import { Config } from './config';



export const DB = (async () => {
    let db = await MongoClient.connect(Config.db.url);
    console.log(`db:connect`);
    if (Config.db.auth !== null) {
        await db.authenticate(Config.db.auth.user, Config.db.auth.pass);
        console.log(`db:auth`);
    }
    return db;
})();