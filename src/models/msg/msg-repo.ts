import { AtNotFoundError, AtNotFoundPartError } from "../../at-error";
import { IAuthToken } from "../../auth";
import { ESClient } from "../../db";
import { IMsgRepo } from "./imsg-repo";
import { IMsgDB, Msg } from "./msg";

export class MsgRepo implements IMsgRepo {
  async findOne(id: string): Promise<Msg> {
    const msgs = await ESClient.search<IMsgDB["body"]>({
      index: "msgs",
      size: 1,
      body: {
        query: {
          term: {
            _id: id,
          },
        },
      },
    });

    if (msgs.hits.total === 0) {
      throw new AtNotFoundError("メッセージが存在しません");
    }

    return Msg.fromDB(msgs.hits.hits.map(m => ({ id: m._id, body: m._source }))[0]);
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

  async insert(msg: Msg): Promise<null> {
    const mDB = msg.toDB();
    await ESClient.create({
      index: "msgs",
      type: "normal",
      id: mDB.id,
      body: mDB.body,
    });
    return null;
  }

  async update(msg: Msg): Promise<null> {
    const mDB = msg.toDB();
    await ESClient.update({
      index: "msgs",
      type: "normal",
      id: mDB.id,
      body: mDB.body,
    });
    return null;
  }
}
