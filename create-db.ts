import { DB } from './db';

(async () => {
    let db = await DB;

    await db.createCollection("clients");

    await db.createCollection("histories");

    await db.createCollection("msgs");

    await db.createCollection("profiles");

    await db.createCollection("reses");

    let tokens = await db.createCollection("tokens");
    await tokens.createIndex({ client: 1, user: 1 }, { unique: true });

    await db.createCollection("topics");

    let user = await db.createCollection("users");
    await user.createIndex({ sn: 1 }, { unique: true });

    console.log("完了");
    process.exit();
})();