import { AtNotFoundError, AtNotFoundPartError } from "../../at-error";
import { IAuthToken } from "../../auth";
import { ESClient } from "../../db";
import { IMsgRepo } from "./imsg-repo";
import { IMsgDB, Msg } from "./msg";
import { Refresh } from "elasticsearch";

export class MsgRepo implements IMsgRepo {
  constructor(private refresh?: Refresh) { }

  async findOne(id: string): Promise<Msg> {
    try {
      const msg = await ESClient.get<IMsgDB["body"]>({
        index: "msgs",
        type: "doc",
        id
      });

      return Msg.fromDB(({ id: msg._id, body: msg._source }));
    } catch{
      throw new AtNotFoundError("メッセージが存在しません");
    }
  }

  async findIn(ids: string[]): Promise<Msg[]> {
    const msgs = await ESClient.search<IMsgDB["body"]>({
      index: "msgs",
      size: ids.length,
      body: {
        query: {
          terms: {
            _id: ids,
          },
        },
        sort: { ageUpdate: { order: "desc" } },
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
    type: "before" | "after",
    equal: boolean,
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
                  [type === "after" ? (equal ? "gte" : "gt") : (equal ? "lte" : "lt")]: date.toISOString(),
                },
              },
              {
                bool: {
                  should: [
                    { term: { receiver: null } },
                    { term: { receiver: authToken.user } },
                  ],
                },
              },
            ],
          },
        },
        sort: { date: { order: type === "after" ? "asc" : "desc" } },
      },
    });

    const result = msgs.hits.hits.map(m => Msg.fromDB({ id: m._id, body: m._source }));
    if (type === "after") {
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
              { term: { receiver: null } },
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
    await ESClient.update({
      index: "msgs",
      type: "doc",
      id: mDB.id,
      body: mDB.body,
      refresh: this.refresh,
    });
  }
}
