import { AtNotFoundError, AtNotFoundPartError } from "../../at-error";
import { IAuthToken } from "../../auth";
import { ESClient } from "../../db";
import { IMsgRepo } from "./imsg-repo";
import { IMsgDB, Msg } from "./msg";
import { DateType } from "../../server/index";

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

  async find2(
    authToken: IAuthToken,
    query: {
      date: DateType | null,
      id: string[] | null
    },
    limit: number): Promise<Msg[]> {
    const filter: any[] = [{
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
    }];
    if (query.date !== null) {
      filter.push({
        range: {
          date: {
            [query.date.type]: query.date.date,
          },
        },
      });
    }
    if (query.id !== null) {
      filter.push({
        terms: {
          _id: query.id,
        }
      });
    }
    const msgs = await ESClient.search<IMsgDB["body"]>({
      index: "msgs",
      size: limit,
      body: {
        query: {
          bool: {
            filter: filter,
          },
        },
        sort: { date: { order: query.date !== null && (query.date.type === "gt" || query.date.type === "gte") ? "asc" : "desc" } },
      },
    });

    const result = msgs.hits.hits.map(m => Msg.fromDB({ id: m._id, body: m._source }));
    if (query.date !== null && (query.date.type === "gt" || query.date.type === "gte")) {
      result.reverse();
    }
    return result;
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
