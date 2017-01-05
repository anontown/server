import { DB } from './db';
import * as fs from 'fs';

let updateFunc: (() => Promise<void>)[] = [];

updateFunc.push((async () => {
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
}));

updateFunc.push((async () => {
    let db = await DB;

    await db.collection("users").update({}, { $set: { point: 0 } }, { multi: true });
}));


export async function update() {
    let ver: number;
    try {
        ver = JSON.parse(fs.readFileSync("./db-version.json", "utf8"));
    } catch (e) {
        //ファイルがなければ0
        ver = 0;
    }

    for (let i = ver; i < updateFunc.length; i++) {
        await updateFunc[i]();
    }

    fs.writeFileSync("./db-version.json", JSON.stringify(updateFunc.length), {
        encoding: "utf8"
    });
}