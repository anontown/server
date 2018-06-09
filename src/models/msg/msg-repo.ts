import { AtNotFoundError, AtNotFoundPartError } from "../../at-error";
import { IAuthToken } from "../../auth";
import { ESClient } from "../../db";
import { IMsgRepo } from "./imsg-repo";
import { IMsgDB, Msg } from "./msg";

export class MsgRepo implements IMsgRepo {
  constructor(private refresh?: boolean) { }

  async findOne(id: string): Promise<Msg> {
    let msg;
    try {
      msg = await ESClient.get<IMsgDB["body"]>({
        index: "msgs",
        type: "doc",
        id,
      });
    } catch {
      throw new AtNotFoundError("メッセージが存在しません");
    }

    return Msg.fromDB(({ id: msg._id, body: msg._source }));
  }

  async findIn(ids: string[]): Promise<Msg[]> {
    const msgs = await ESClient.search<IMsgDB["body"]>({
      index: "msgs",
      type: "doc",
      size: ids.length,
      body: {
        query: {
          terms: {
            _id: ids,
          },
        },
        sort: { date: { order: "desc" } },
      },
    });

    if (msgs.hits.total !== ids.length) {
      throw new AtNotFoundPartError("メッセージが存在しません",
        msgs.hits.hits.map(m => m._id));
    }

    return msgs.hits.hits.map(m => Msg.fromDB({ id: m._id, body: m._source }));
  }

  async find(
    authToken: IAuthToken,
    type: "gt" | "gte" | "lt" | "lte",
    date: Date,
    limit: number): Promise<Msg[]> {
    const msgs = await ESClient.search<IMsgDB["body"]>({
      index: "msgs",
      size: limit,
      body: {
        query: {
          bool: {
            filter: [
              {
                range: {
                  date: {
                    [type]: date.toISOString(),
                  },
                },
              },
              {
                bool: {
                  should: [
                    {
                      bool: {
                        must_not: {
                          exists: {
                            field: "receiver",
                          },
                        },
                      },
                    },
                    { term: { receiver: authToken.user } },
                  ],
                },
              },
            ],
          },
        },
        sort: { date: { order: type === "gt" || type === "gte" ? "asc" : "desc" } },
      },
    });

    const result = msgs.hits.hits.map(m => Msg.fromDB({ id: m._id, body: m._source }));
    if (type === "gt" || type === "gte") {
      result.reverse();
    }
    return result;
  }

  async findNew(authToken: IAuthToken, limit: number): Promise<Msg[]> {
    const msgs = await ESClient.search<IMsgDB["body"]>({
      index: "msgs",
      size: limit,
      body: {
        query: {
          bool: {
            should: [
              {
                bool: {
                  must_not: {
                    exists: {
                      field: "receiver",
                    },
                  },
                },
              },
              { term: { receiver: authToken.user } },
            ],
          },
        },
        sort: { date: { order: "desc" } },
      },
    });

    return msgs.hits.hits.map(m => Msg.fromDB({ id: m._id, body: m._source }));
  }

  async insert(msg: Msg): Promise<void> {
    const mDB = msg.toDB();
    await ESClient.create({
      index: "msgs",
      type: "doc",
      id: mDB.id,
      body: mDB.body,
      refresh: this.refresh,
    });
  }

  async update(msg: Msg): Promise<void> {
    const mDB = msg.toDB();
    await ESClient.index({
      index: "msgs",
      type: "doc",
      id: mDB.id,
      body: mDB.body,
      refresh: this.refresh !== undefined ? this.refresh.toString() : undefined,
    });
  }
}
