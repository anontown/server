import * as fs from "fs-promise";
import { ObjectID } from "mongodb";
import { Config } from "./config";
import { DB, ESClient } from "./db";
import { Logger } from "./logger";
import { IProfileDB } from "./models/profile";
import { hash } from "./utils";

const updateFunc: Array<() => Promise<void>> = [];

updateFunc.push((async () => {
  const db = await DB;

  await db.createCollection("clients");

  await db.createCollection("histories");

  await db.createCollection("msgs");

  await db.createCollection("profiles");

  await db.createCollection("reses");

  const tokens = await db.createCollection("tokens");
  await tokens.createIndex({ client: 1, user: 1 }, { unique: true });

  await db.createCollection("topics");

  const user = await db.createCollection("users");
  await user.createIndex({ sn: 1 }, { unique: true });
}));

updateFunc.push((async () => {
  const db = await DB;

  await db.collection("users").update({}, { $set: { point: 0 } }, { multi: true });
}));

updateFunc.push((async () => {
  const db = await DB;

  const board = await db.createCollection("boards");
  await board.createIndex({ category: 1 }, { unique: true });
  await db.collection("topics").update({}, { $set: { type: "normal" } }, { multi: true });
}));

updateFunc.push((async () => {
  const db = await DB;

  // reply:ObjectID(ResID)|nullをreply:{res:ObjectID,User:ObjectID}|nullに変換

  // replyがnullでないレス取得
  const targetReses: Array<{ _id: ObjectID, reply: ObjectID }> =
    await db.collection("reses")
      .find({ reply: { $ne: null } })
      .toArray();

  // reply先のレス取得
  const replyReses: Array<{ _id: ObjectID, user: ObjectID }> =
    await db.collection("reses")
      .find({ _id: { $in: targetReses.map(x => x.reply) } })
      .toArray();

  // 更新
  const promises: Array<Promise<any>> = [];
  targetReses.forEach(x => {
    promises.push(db.collection("reses")
      .update(
      {
        _id: x._id,
      },
      {
        $set: {
          reply: {
            res: x.reply, user: replyReses.find(y => x.reply.equals(y._id))!.user,
          },
        },
      },
    ));
  });

  await Promise.all(promises);
}));

updateFunc.push((async () => {
  // HASHのイコール削除
  const db = await DB;
  const promises: Array<Promise<any>> = [];

  const reses: Array<{ _id: ObjectID, hash: string }> = await db.collection("reses").find().toArray();
  reses.forEach(r => {
    promises.push(db.collection("reses").update({ _id: r._id }, { $set: { hash: r.hash.replace(/=/, "") } }));
  });

  const histories: Array<{ _id: ObjectID, hash: string }> = await db.collection("histories").find().toArray();
  histories.forEach(h => {
    promises.push(db.collection("histories").update({ _id: h._id }, { $set: { hash: h.hash.replace(/=/, "") } }));
  });

  await Promise.all(promises);
}));
updateFunc.push((async () => {
  // ハッシュをmd5→sha256に

  // ハッシュ関数
  const hashFunc = (user: ObjectID, topic: ObjectID, date: Date) =>
    hash(
      // ユーザー依存
      user + " " +

      // 書き込み年月日依存
      date.getFullYear() + " " + date.getMonth() + " " + date.getDate() + " " +

      // トピ依存
      topic +

      // ソルト依存
      Config.salt.hash);

  // レス、履歴取得
  const db = await DB;
  const rdb = db.collection("reses");
  const hdb = db.collection("histories");
  const reses = await rdb.find().toArray();
  const histories = await hdb.find().toArray();

  const promises: Array<Promise<any>> = [];
  reses.forEach(r => {
    promises.push(rdb.update({ _id: r._id }, { $set: { hash: hashFunc(r.user, r.topic, r.date) } }));
  });
  histories.forEach(h => {
    promises.push(hdb.update({ _id: h._id }, { $set: { hash: hashFunc(h.user, h.topic, h.date) } }));
  });

  await Promise.all(promises);
}));

updateFunc.push((async () => {
  // topicにsage機能を実装するための修正
  const db = await DB;
  const promises: Array<Promise<any>> = [];

  const topics = await db.collection("topics").find().toArray();
  topics.forEach(t => {
    promises.push(db.collection("topics").update({ _id: t._id }, { $set: { ageUpdate: t.update } }));
  });
  promises.push(db.collection("reses").update({}, { $set: { age: true } }, { multi: true }));

  await Promise.all(promises);
}));

updateFunc.push((async () => {
  const db = await DB;
  const promises: Array<Promise<any>> = [];

  const profiles: IProfileDB[] = await db.collection("profiles").find().toArray();
  profiles.forEach(p => {
    promises.push(db.collection("profiles").update({ _id: p._id }, { $set: { sn: p._id.toString() } }));
  });
  await db.collection("profiles").createIndex({ sn: 1 }, { unique: true });

  await Promise.all(promises);
}));

updateFunc.push((async () => {
  const db = await DB;

  await db.collection("reses").update({}, { $set: { vote: [] }, $unset: { voteUser: 1 } }, { multi: true });
}));

updateFunc.push((async () => {
  const db = await DB;

  await db.collection("users").update({}, { $set: { lastOneTopic: new Date() } }, { multi: true });
  await db.collection("topics").update({}, { $set: { active: true } }, { multi: true });
}));

updateFunc.push((async () => {
  const db = await DB;

  await db.dropCollection("boards");
  await db.collection("topics").update({ type: "board" }, { $set: { type: "normal", active: false } }, { multi: true });
  await db.collection("topics").update({}, { $rename: { category: "tags" } }, { multi: true });
  await db.collection("histories").update({}, { $rename: { category: "tags" } }, { multi: true });
}));

updateFunc.push((async () => {
  const db = await DB;

  const ts: Array<{ _id: ObjectID, storage: string }> = await db.collection("tokens").find().toArray();
  const ps: Array<Promise<void>> = [];
  await fs.mkdir("./storage");
  ts.forEach(t => {
    const dir = "./storage/" + t._id.toString() + "/";
    ps.push((async () => {
      await fs.mkdir(dir);
      await fs.writeFile(dir + "st-main", t.storage);
    })());
  });
  await Promise.all(ps);

  await db.collection("tokens").update({}, { $unset: { storage: 1 } }, { multi: true });
}));

updateFunc.push((async () => {
  const db = await DB;

  await db.collection("tokens").update({}, { $set: { type: "general" } }, { multi: true });
}));

updateFunc.push((async () => {
  const db = await DB;

  const storages = await db.createCollection("storages");
  await storages.createIndex({ client: 1, user: 1, key: 1 }, { unique: true });

  // ユニークインデックス削除
  db.collection("tokens").dropIndexes();

  const tokenIDs = (await fs.readdir("./storage"))
    .map(x => {
      try {
        return new ObjectID(x);
      } catch (_e) {
        return null;
      }
    }).filter(x => x !== null) as ObjectID[];
  const tokens: Array<{ _id: ObjectID, client?: ObjectID, user: ObjectID }> = await db.collection("tokens")
    .find({ _id: { $in: tokenIDs } })
    .toArray();

  for (const token of tokens) {
    const fileNames = (await fs.readdir("./storage/" + token._id.toString()));
    for (const fileName of fileNames) {
      const value = await fs.readFile("./storage/" + token._id.toString() + "/" + fileName, { encoding: "utf8" });
      const key = fileName.substr(3);

      await storages.insert({
        _id: new ObjectID(),
        client: token.client ? token.client : null,
        user: token.user,
        key,
        value,
      });
    }
  }

  // トークン削除
  await db.collection("tokens").remove({});
}));

updateFunc.push((async () => {
  const db = await DB;

  // mdtext削除
  for (const col of ["topics", "reses", "profiles", "msgs", "histories"]) {
    await db.collection(col).update({}, { $unset: { mdtext: 1 } }, { multi: true });
  }

  const resesCol = db.collection("reses");

  // 投票による削除→active
  await resesCol.update({ deleteFlag: "vote" }, { $set: { deleteFlag: "active" } }, { multi: true });

  // msgs削除
  await db.collection("msgs").remove({});

  // 名無し→null
  await resesCol.update({ name: "anonymous" }, { $set: { name: null } }, { multi: true });

  // 名前の●プロフィール削除
  {
    // 名前に●が付くレス
    const reses: Array<{ name: string, _id: ObjectID }> =
      await resesCol.find({ name: /●/ }).toArray();
    for (const res of reses) {
      const [name] = res.name.split("●");
      await resesCol.update({ _id: res._id }, { $set: { name: name.length === 0 ? null : name } });
    }
  }

  // 名前に■が付くレス
  // fork or oneの1
  {
    const reses = await resesCol
      .find({ name: "■トピ主" })
      .toArray();
    const topics = await db.collection("topics")
      .find({ _id: { $in: reses.map(x => x.topic) } })
      .toArray();
    for (const res of reses) {
      const db = {
        _id: res._id,
        topic: res.topic,
        date: topics.find(x => x._id.equals(res.topic)).date,
        user: res.user,
        vote: res.vote,
        lv: res.lv,
        hash: res.hash,
        type: "topic",
      };

      await resesCol.update({ _id: res._id }, db);
    }
  }

  // normalの編集履歴通知
  {
    const reses = await resesCol
      .find({ name: "■トピックデータ" })
      .sort({ date: 1 })
      .toArray();

    const histories = await db.collection("histories")
      .find({})
      .sort({ date: 1 })
      .toArray();

    for (let i = 0; i < reses.length; i++) {
      const res = reses[i];
      const history = histories[i];

      const db = {
        _id: res._id,
        topic: res.topic,
        date: history.date,
        user: res.user,
        vote: res.vote,
        lv: res.lv,
        hash: res.hash,
        type: "history",
        history: history._id,
      };

      await resesCol.update({ _id: res._id }, db);
    }
  }

  // forkの建て通知
  {
    const reses = await resesCol
      .find({ name: "■派生トピック" })
      .sort({ date: 1 })
      .toArray();

    const topics = await db.collection("topics")
      .find({ type: "fork" })
      .sort({ date: 1 })
      .toArray();

    for (let i = 0; i < reses.length; i++) {
      const res = reses[i];
      const topic = topics[i];

      const db = {
        _id: res._id,
        topic: res.topic,
        date: topic.date,
        user: res.user,
        vote: res.vote,
        lv: res.lv,
        hash: res.hash,
        type: "fork",
        fork: topic._id,
      };

      await resesCol.update({ _id: res._id }, db);
    }
  }

  // type normalをセット
  {
    await resesCol.update({ type: { $exists: false } }, { $set: { type: "normal" } }, { multi: true });
  }
}));

updateFunc.push(async () => {
  const db = await DB;

  await db.collection("histories").update({}, { $rename: { text: "body" } }, { multi: true });
  await db.collection("msgs").update({}, { $rename: { text: "body" } }, { multi: true });
  await db.collection("profiles").update({}, { $rename: { text: "body" } }, { multi: true });
  await db.collection("reses").update({}, { $rename: { text: "body" }, $unset: { "vote.lv": 1 } }, { multi: true });
  await db.collection("topics").update({}, { $rename: { text: "body" } }, { multi: true });

  const resBaseProps = {
    topic: {
      type: "keyword",
    },
    date: {
      type: "date",
    },
    user: {
      type: "keyword",
    },
    vote: {
      type: "nested",
      properties: {
        user: {
          type: "keyword",
        },
        value: {
          type: "integer",
        },
        lv: {
          type: "integer",
        },
      },
    },
    lv: {
      type: "integer",
    },
    hash: {
      type: "keyword",
    },
  };

  await ESClient.putTemplate({
    id: "analyzer_template",
    body: {
      index_patterns: ["*"],
      settings: {
        analysis: {
          analyzer: {
            default: {
              type: "custom",
              tokenizer: "kuromoji_tokenizer",
              char_filter: [
                "icu_normalizer",
                "kuromoji_iteration_mark",
              ],
              filter: [
                "kuromoji_baseform",
                "kuromoji_part_of_speech",
                "ja_stop",
                "kuromoji_number",
                "kuromoji_stemmer",
              ],
            },
          },
        },
      },
    },
  });

  await ESClient.indices.create({
    index: "reses",
    body: {
      mappings: {
        normal: {
          dynamic: "strict",
          properties: {
            ...resBaseProps,
            name: {
              type: "text",
            },
            body: {
              type: "text",
            },
            reply: {
              type: "nested",
              properties: {
                res: {
                  type: "text",
                },
                user: {
                  type: "text",
                },
              },
            },
            deleteFlag: {
              type: "keyword",
            },
            profile: {
              type: "keyword",
            },
            age: {
              type: "boolean",
            },
          },
        },
        history: {
          dynamic: "strict",
          properties: {
            ...resBaseProps,
            history: {
              type: "keyword",
            },
          },
        },
        topic: {
          dynamic: "strict",
          properties: {
            ...resBaseProps,
          },
        },
        fork: {
          dynamic: "strict",
          properties: {
            ...resBaseProps,
            fork: {
              type: "keyword",
            },
          },
        },
      },
    },
  });

  await ESClient.indices.create({
    index: "histories",
    body: {
      mappings: {
        normal: {
          dynamic: "strict",
          properties: {
            topic: {
              type: "keyword",
            },
            title: {
              type: "text",
            },
            tags: {
              type: "keyword",
            },
            body: {
              type: "text",
            },
            date: {
              type: "date",
            },
            hash: {
              type: "keyword",
            },
            user: {
              type: "keyword",
            },
          },
        },
      },
    },
  });

  await ESClient.indices.create({
    index: "msgs",
    body: {
      mappings: {
        normal: {
          dynamic: "strict",
          properties: {
            receiver: {
              type: "keyword",
            },
            body: {
              type: "text",
            },
            date: {
              type: "date",
            },
          },
        },
      },
    },
  });

  const topicBaseProps = {
    title: {
      type: "text",
    },
    update: {
      type: "date",
    },
    date: {
      type: "date",
    },
    ageUpdate: {
      type: "date",
    },
    active: {
      type: "boolean",
    },
  };

  const topicSearchBaseProps = {
    ...topicBaseProps,
    tags: {
      type: "keyword",
    },
    body: {
      type: "text",
    },
  };

  await ESClient.indices.create({
    index: "topics",
    body: {
      mappings: {
        normal: {
          dynamic: "strict",
          properties: {
            ...topicSearchBaseProps,
          },
        },
        one: {
          dynamic: "strict",
          properties: {
            ...topicSearchBaseProps,
          },
        },
        fork: {
          dynamic: "strict",
          properties: {
            ...topicBaseProps,
            parent: {
              type: "keyword",
            },
          },
        },
      },
    },
  });
});

/*
  -----------------------------------------------------------------------------
*/
export async function createDB() {
  let ver: number;
  try {
    ver = JSON.parse(fs.readFileSync("./data/db-version.json", "utf8"));
  } catch (e) {
    // ファイルがなければ0
    ver = 0;
  }
  Logger.system.info(`現在のDBバージョン:${ver}`);

  for (let i = ver; i < updateFunc.length; i++) {
    Logger.system.info(`update db:${i}`);
    await updateFunc[i]();
    Logger.system.info(`updated db:${i}`);
  }

  fs.writeFileSync("./data/db-version.json", JSON.stringify(updateFunc.length), {
    encoding: "utf8",
  });
  Logger.system.info(`DBアップデート完了:${updateFunc.length}`);
}
