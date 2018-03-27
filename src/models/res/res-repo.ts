import { GetResponse, Refresh } from "elasticsearch";
import { Subject } from "rxjs";
import { AtNotFoundError, AtNotFoundPartError } from "../../at-error";
import { IAuthToken } from "../../auth";
import { Config } from "../../config";
import { ESClient } from "../../db";
import { IResRepo } from "./ires-repo";
import { fromDBToRes, IResDB, IResNormalDB, Res } from "./res";

export class ResRepo implements IResRepo {
  readonly insertEvent: Subject<{ res: Res, count: number }> = new Subject<{ res: Res, count: number }>();

  constructor(private refresh?: Refresh) { }

  async findOne(id: string): Promise<Res> {
    let res: GetResponse<IResDB["body"]>;
    try {
      res = await ESClient.get<IResDB["body"]>({
        index: "reses",
        type: "doc",
        id,
      });
    } catch {
      throw new AtNotFoundError("レスが存在しません");
    }
    return (await this.aggregate([{ id: res._id, body: res._source } as IResDB]))[0];
  }

  async findIn(ids: string[]): Promise<Res[]> {
    const reses = await ESClient.search<IResDB["body"]>({
      index: "reses",
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

    if (reses.hits.total !== ids.length) {
      throw new AtNotFoundPartError("レスが存在しません",
        reses.hits.hits.map(r => r._id));
    }

    return this.aggregate(reses.hits.hits.map(r => ({ id: r._id, body: r._source } as IResDB)));
  }

  async find(topicID: string, type: "before" | "after", equal: boolean, date: Date, limit: number): Promise<Res[]> {
    const reses = await ESClient.search<IResDB["body"]>({
      index: "reses",
      size: limit,
      body: {
        query: {
          bool: {
            filter: [
              {
                range: {
                  date: {
                    [type === "after" ? (equal ? "gte" : "gt") : (equal ? "lte" : "lt")]: date.toISOString(),
                  },
                },
              },
              {
                term: {
                  topic: topicID,
                },
              },
            ],
          },
        },
        sort: { date: { order: type === "after" ? "asc" : "desc" } },
      },
    });

    const result = await this.aggregate(reses.hits.hits.map(r => ({ id: r._id, body: r._source } as IResDB)));
    if (type === "after") {
      result.reverse();
    }
    return result;
  }

  async findNew(topicID: string, limit: number): Promise<Res[]> {
    const reses = await ESClient.search<IResDB["body"]>({
      index: "reses",
      size: limit,
      body: {
        query: {
          term: {
            topic: topicID,
          },
        },
        sort: { date: { order: "desc" } },
      },
    });

    return await this.aggregate(reses.hits.hits.map(r => ({ id: r._id, body: r._source } as IResDB)));
  }

  async findNotice(
    authToken: IAuthToken,
    type: "before" | "after",
    equal: boolean,
    date: Date,
    limit: number): Promise<Res[]> {
    const reses = await ESClient.search<IResDB["body"]>({
      index: "reses",
      size: limit,
      body: {
        query: {
          bool: {
            filter: [
              {
                range: {
                  date: {
                    [type === "after" ? (equal ? "gte" : "gt") : (equal ? "lte" : "lt")]: date.toISOString(),
                  },
                },
              },
              {
                nested: {
                  path: "reply",
                  query: {
                    term: {
                      "reply.user": authToken.user,
                    }
                  }
                }
              },
            ],
          },
        },
        sort: { date: { order: type === "after" ? "asc" : "desc" } },
      },
    });

    const result = await this.aggregate(reses.hits.hits.map(r => ({ id: r._id, body: r._source } as IResDB)));
    if (type === "after") {
      result.reverse();
    }
    return result;
  }

  async findNoticeNew(authToken: IAuthToken, limit: number): Promise<Res[]> {
    const reses = await ESClient.search<IResDB["body"]>({
      index: "reses",
      size: limit,
      body: {
        query: {
          term: {
            "reply.user": authToken.user,
          },
        },
        sort: { date: { order: "desc" } },
      },
    });

    return await this.aggregate(reses.hits.hits.map(r => ({ id: r._id, body: r._source } as IResDB)));
  }

  async findHash(hash: string): Promise<Res[]> {
    const reses = await ESClient.search<IResNormalDB["body"]>({
      index: "reses",
      size: Config.api.limit,
      body: {
        query: {
          term: {
            hash,
          },
        },
        sort: { date: { order: "desc" } },
      },
    });

    return await this.aggregate(reses.hits.hits.map(r => ({ id: r._id, body: r._source } as IResDB)));
  }

  async findReply(res: Res): Promise<Res[]> {
    const reses = await ESClient.search<IResNormalDB["body"]>({
      index: "reses",
      size: Config.api.limit,
      body: {
        query: {
          term: {
            "reply.res": res.id,
            "type": "normal",
          },
        },
        sort: { date: { order: "desc" } },
      },
    });

    return await this.aggregate(reses.hits.hits.map(r => ({ id: r._id, body: r._source } as IResDB)));
  }

  async insert(res: Res): Promise<void> {
    const rDB = res.toDB();
    await ESClient.create({
      index: "reses",
      type: "doc",
      id: rDB.id,
      body: rDB.body,
      refresh: this.refresh,
    });

    const resCount = (await this.resCount([res.topic])).get(res.topic) || 0;
    this.insertEvent.next({ res, count: resCount });
  }

  async update(res: Res): Promise<void> {
    const rDB = res.toDB();
    await ESClient.index({
      index: "reses",
      type: "doc",
      id: rDB.id,
      body: rDB.body,
      refresh: this.refresh !== undefined ? this.refresh.toString() : undefined,
    });
  }

  async resCount(topicIDs: string[]): Promise<Map<string, number>> {
    const data = await ESClient.search({
      index: "reses",
      size: 0,
      body: {
        query: {
          terms: {
            topic: topicIDs,
          },
        },
        aggs: {
          res_count: {
            terms: {
              field: "topic",
            },
          },
        },
      },
    });

    const countArr: { key: string, doc_count: number }[] = data.aggregations.res_count.buckets;
    return new Map(countArr.map<[string, number]>(x => [x.key, x.doc_count]));
  }

  private async aggregate(reses: IResDB[]): Promise<Res[]> {
    const data = await ESClient.search({
      index: "reses",
      size: 0,
      body: {
        query: {
          terms: {
            // TODO:ここのクエリおかしい気がする
            id: reses.map(r => r.id),
          },
        },
        aggs: {
          reply_count: {
            terms: {
              field: "reply.res",
            },
          },
        },
      },
    });

    const countArr: { key: string, doc_count: number }[] = data.aggregations.reply_count.buckets;
    const count = new Map(countArr.map<[string, number]>(x => [x.key, x.doc_count]));

    return reses.map(r => fromDBToRes(r, count.get(r.id) || 0));
  }
}
