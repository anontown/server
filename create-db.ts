import { DB } from './db';
import * as fs from 'fs';
import { ObjectID } from 'mongodb';

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

updateFunc.push((async () => {
  let db = await DB;

  let board = await db.createCollection("boards");
  await board.createIndex({ category: 1 }, { unique: true });
  await db.collection("topics").update({}, { $set: { type: "normal" } }, { multi: true });
}));

updateFunc.push((async () => {
  let db = await DB;

  //reply:ObjectID(ResID)|nullをreply:{res:ObjectID,User:ObjectID}|nullに変換

  //replyがnullでないレス取得
  let targetReses: { _id: ObjectID, reply: ObjectID }[] =
    await db.collection("reses")
      .find({ reply: { $ne: null } })
      .toArray();

  //reply先のレス取得
  let replyReses: { _id: ObjectID, user: ObjectID }[] =
    await db.collection("reses")
      .find({ _id: { $in: targetReses.map(x => x.reply) } })
      .toArray();

  //更新
  let promises: Promise<any>[] = [];
  targetReses.forEach(x => {
    promises.push(db.collection("reses")
      .update(
      {
        _id: x._id
      },
      {
        $set: {
          reply: {
            res: x.reply, user: replyReses.find(y => x.reply.equals(y._id)) !.user
          }
        }
      }
      ))
  });

  await Promise.all(promises);
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