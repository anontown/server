import { DB } from './db';
import * as fs from 'fs-promise';
import { ObjectID } from 'mongodb';
import { IResDB } from './models/res';
import { IHistoryDB } from './models/history';
import { StringUtil } from './util';
import { Config } from './config';
import { ITopicDB } from './models/topic';
import { IProfileDB } from './models/profile';

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
            res: x.reply, user: replyReses.find(y => x.reply.equals(y._id))!.user
          }
        }
      }
      ))
  });

  await Promise.all(promises);
}));

updateFunc.push((async () => {
  //HASHのイコール削除
  let db = await DB;
  let promises: Promise<any>[] = [];

  let reses: { _id: ObjectID, hash: string }[] = await db.collection("reses").find().toArray();
  reses.forEach(r => {
    promises.push(db.collection("reses").update({ _id: r._id }, { $set: { hash: r.hash.replace(/=/, "") } }))
  });

  let histories: { _id: ObjectID, hash: string }[] = await db.collection("histories").find().toArray();
  histories.forEach(h => {
    promises.push(db.collection("histories").update({ _id: h._id }, { $set: { hash: h.hash.replace(/=/, "") } }))
  });

  await Promise.all(promises);
}));
updateFunc.push((async () => {
  //ハッシュをmd5→sha256に

  //ハッシュ関数
  let hashFunc = (user: ObjectID, topic: ObjectID, date: Date) =>
    StringUtil.hash(
      //ユーザー依存
      user + " " +

      //書き込み年月日依存
      date.getFullYear() + " " + date.getMonth() + " " + date.getDate() + " " +

      //トピ依存
      topic +

      //ソルト依存
      Config.salt.hash);

  //レス、履歴取得
  let db = await DB;
  let rdb = db.collection("reses");
  let hdb = db.collection("histories");
  let reses: IResDB[] = await rdb.find().toArray();
  let histories: IHistoryDB[] = await hdb.find().toArray();

  let promises: Promise<any>[] = [];
  reses.forEach(r => {
    promises.push(rdb.update({ _id: r._id }, { $set: { hash: hashFunc(r.user, r.topic, r.date) } }));
  });
  histories.forEach(h => {
    promises.push(hdb.update({ _id: h._id }, { $set: { hash: hashFunc(h.user, h.topic, h.date) } }));
  });

  await Promise.all(promises);
}));

updateFunc.push((async () => {
  //topicにsage機能を実装するための修正
  let db = await DB;
  let promises: Promise<any>[] = [];

  let topics: ITopicDB[] = await db.collection("topics").find().toArray();
  topics.forEach(t => {
    promises.push(db.collection("topics").update({ _id: t._id }, { $set: { ageUpdate: t.update } }))
  });
  promises.push(db.collection("reses").update({}, { $set: { age: true } }, { multi: true }))

  await Promise.all(promises);
}));

updateFunc.push((async () => {
  let db = await DB;
  let promises: Promise<any>[] = [];

  let profiles: IProfileDB[] = await db.collection("profiles").find().toArray();
  profiles.forEach(p => {
    promises.push(db.collection("profiles").update({ _id: p._id }, { $set: { sn: p._id.toString() } }))
  });
  await db.collection("profiles").createIndex({ sn: 1 }, { unique: true });

  await Promise.all(promises);
}));

updateFunc.push((async () => {
  let db = await DB;

  await db.collection("reses").update({}, { $set: { vote: [] }, $unset: { voteUser: 1 } }, { multi: true });
}));

updateFunc.push((async () => {
  let db = await DB;

  await db.collection("users").update({}, { $set: { lastOneTopic: new Date() } }, { multi: true });
  await db.collection("topics").update({}, { $set: { active: true } }, { multi: true });
}));

updateFunc.push((async () => {
  let db = await DB;

  await db.dropCollection("boards");
  await db.collection("topics").update({ type: "board" }, { $set: { type: "normal", active: false } }, { multi: true });
  await db.collection("topics").update({}, { $rename: { category: "tags" } }, { multi: true });
  await db.collection("histories").update({}, { $rename: { category: "tags" } }, { multi: true });
}));

updateFunc.push((async () => {
  let db = await DB;

  let ts: { _id: ObjectID, storage: string }[] = await db.collection("tokens").find().toArray();
  let ps: Promise<void>[] = [];
  ts.forEach(t => {
    let dir = "./storage/" + t._id.toString() + "/";
    ps.push((async () => {
      await fs.mkdir(dir);
      await fs.writeFile(dir + "st-main", t.storage);
    })());
  });
  await Promise.all(ps);

  await db.collection("tokens").update({}, { $unset: { storage: 1 } }, { multi: true });
}));

updateFunc.push((async () => {
  let db = await DB;

  await db.collection("tokens").update({}, { $set: { type: 'general' } }, { multi: true });
}));

updateFunc.push((async () => {
  let db = await DB;

  let storages = await db.createCollection("storages");
  await storages.createIndex({ client: 1, user: 1, key: 1 }, { unique: true });

  //ユニークインデックス削除
  db.collection("tokens").dropIndexes();

  let tokenIDs = (await fs.readdir("./storage"))
    .map(x => {
      try {
        return new ObjectID(x);
      } catch (_e) {
        return null;
      }
    }).filter(x => x !== null) as ObjectID[];
  let tokens: { _id: ObjectID, client?: ObjectID, user: ObjectID }[] = await db.collection("tokens")
    .find({ _id: { $in: tokenIDs } })
    .toArray();

  for (let token of tokens) {
    let fileNames = (await fs.readdir('./storage/' + token._id.toString()));
    for (let fileName of fileNames) {
      let value = await fs.readFile("./storage/" + token._id.toString() + "/" + fileName, { encoding: "utf8" });
      let key = fileName.substr(3);

      await storages.insert({
        _id: new ObjectID,
        client: token.client ? token.client : null,
        user: token.user,
        key,
        value
      });
    }
  }
}));

/*
  -----------------------------------------------------------------------------
*/
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