import { DB, ESClient } from "../db";

export async function up(next: () => void) {
  const db = await DB();

  const clients = await db.createCollection("clients");
  await clients.createIndex({ user: 1 });
  await clients.createIndex({ date: 1 });
  await clients.createIndex({ update: 1 });

  const profiles = await db.createCollection("profiles");
  await profiles.createIndex({ user: 1 });
  await profiles.createIndex({ date: 1 });
  await profiles.createIndex({ update: 1 });
  await profiles.createIndex({ sn: 1 }, { unique: true });

  const tokens = await db.createCollection("tokens");
  await tokens.createIndex({ type: 1 });
  await tokens.createIndex({ user: 1 });
  await tokens.createIndex({ date: 1 });
  await tokens.createIndex({ client: 1 });

  const users = await db.createCollection("users");
  await users.createIndex({ sn: 1 }, { unique: true });
  await users.createIndex({ "resWait.m10": 1 });
  await users.createIndex({ "resWait.m30": 1 });
  await users.createIndex({ "resWait.h1": 1 });
  await users.createIndex({ "resWait.h6": 1 });
  await users.createIndex({ "resWait.h12": 1 });
  await users.createIndex({ "resWait.d1": 1 });
  await users.createIndex({ point: 1 });
  await users.createIndex({ date: 1 });

  const storages = await db.createCollection("storages");
  await storages.createIndex({ client: 1, user: 1, key: 1 }, { unique: true });

  await ESClient().putTemplate({
    id: "template",
    body: {
      index_patterns: ["*"],
      settings: {
        "mapping.single_type": true,
        "analysis": {
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

  await ESClient().indices.create({
    index: "reses_1",
    body: {
      mappings: {
        doc: {
          dynamic: "strict",
          properties: {
            // Base
            type: {
              type: "keyword",
            },
            topic: {
              type: "keyword",
            },
            date: {
              type: "date",
            },
            user: {
              type: "keyword",
            },
            votes: {
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
            // Normal
            name: {
              type: "text",
            },
            text: {
              type: "text",
            },
            reply: {
              type: "nested",
              properties: {
                res: {
                  type: "keyword",
                },
                user: {
                  type: "keyword",
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
            // History
            history: {
              type: "keyword",
            },
            // Topic
            // Fork
            fork: {
              type: "keyword",
            },
          },
        },
      },
    },
  });

  await ESClient().indices.create({
    index: "histories_1",
    body: {
      mappings: {
        doc: {
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
            text: {
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

  await ESClient().indices.create({
    index: "msgs_1",
    body: {
      mappings: {
        doc: {
          dynamic: "strict",
          properties: {
            receiver: {
              type: "keyword",
            },
            text: {
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

  await ESClient().indices.create({
    index: "topics_1",
    body: {
      mappings: {
        doc: {
          dynamic: "strict",
          properties: {
            // Base
            type: {
              type: "keyword",
            },
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

            // Search
            tags: {
              type: "keyword",
            },
            text: {
              type: "text",
            },

            // Normal
            // One
            // Fork
            parent: {
              type: "keyword",
            },
          },
        },
      },
    },
  });

  await ESClient().indices.putAlias({
    name: "reses",
    index: "reses_1",
  });

  await ESClient().indices.putAlias({
    name: "histories",
    index: "histories_1",
  });

  await ESClient().indices.putAlias({
    name: "msgs",
    index: "msgs_1",
  });

  await ESClient().indices.putAlias({
    name: "topics",
    index: "topics_1",
  });

  next();
}

export async function down(next: () => void) {
  const db = await DB();

  await db.collection("clients").drop();
  await db.collection("profiles").drop();
  await db.collection("tokens").drop();
  await db.collection("users").drop();
  await db.collection("storages").drop();

  const es = ESClient();

  await es.indices.deleteAlias({ name: "reses", index: "reses_1" });
  await es.indices.deleteAlias({ name: "histories", index: "histories_1" });
  await es.indices.deleteAlias({ name: "msgs", index: "msgs_1" });
  await es.indices.deleteAlias({ name: "topics", index: "topics_1" });
  await es.indices.delete({ index: ["reses_1", "histories_1", "msgs_1", "topics_1"] });
  await es.deleteTemplate({ id: "template" });

  next();
}
