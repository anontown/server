import { Subject } from "rxjs";
import { AtNotFoundError, AtNotFoundPartError } from "../../at-error";
import { IAuthToken } from "../../auth";
import { Config } from "../../config";
import { ESClient } from "../../db";
import { IResRepo } from "./ires-repo";
import { fromDBToRes, IResDB, IResNormalDB, Res } from "./res";

export class ResRepo implements IResRepo {
  readonly insertEvent: Subject<{ res: Res, count: number }> = new Subject<{ res: Res, count: number }>();

  constructor(private refresh?: boolean) { }

  async findOne(id: string): Promise<Res> {
    let res;
    try {
      res = await ESClient.get<IResDB["body"]>({
        index: "reses",
        type: "doc",
        id,
      });
    } catch {
      throw new AtNotFoundError("レスが存在しません");
    }
    return (await this.aggregate([{ id: res._id, body: res._source }]))[0];
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

    return this.aggregate(reses.hits.hits.map(r => ({ id: r._id, body: r._source })));
  }

  async find(topicID: string, type: "gt" | "gte" | "lt" | "lte", date: Date, limit: number): Promise<Res[]> {
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
                    [type]: date.toISOString(),
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
        sort: { date: { order: type === "gt" || type === "gte" ? "asc" : "desc" } },
      },
    });

    const result = await this.aggregate(reses.hits.hits.map(r => ({ id: r._id, body: r._source })));
    if (type === "gt" || type === "gte") {
      result.reverse();
    }
    return result;
  }

  async findNotice(
    authToken: IAuthToken,
    type: "gt" | "gte" | "lt" | "lte",
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
                    [type]: date.toISOString(),
                  },
                },
              },
              {
                nested: {
                  path: "reply",
                  query: {
                    term: {
                      "reply.user": authToken.user,
                    },
                  },
                },
              },
            ],
          },
        },
        sort: { date: { order: type === "gt" || type === "gte" ? "asc" : "desc" } },
      },
    });

    const result = await this.aggregate(reses.hits.hits.map(r => ({ id: r._id, body: r._source })));
    if (type === "gt" || type === "gte") {
      result.reverse();
    }
    return result;
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

    return await this.aggregate(reses.hits.hits.map(r => ({ id: r._id, body: r._source })));
  }

  async findReply(resID: string): Promise<Res[]> {
    const reses = await ESClient.search<IResNormalDB["body"]>({
      index: "reses",
      size: Config.api.limit,
      body: {
        query: {
          nested: {
            path: "reply",
            query: {
              term: {
                "reply.res": resID,
              },
            },
          },
        },
        sort: { date: { order: "desc" } },
      },
    });

    return await this.aggregate(reses.hits.hits.map(r => ({ id: r._id, body: r._source })));
  }

  async insert(res: Res): Promise<void> {
    const rDB = res.toDB();
    await ESClient.create({
      index: "reses",
      type: "doc",
      id: rDB.id,
      body: rDB.body,
      refresh: true,
    });
    // TODO:refresh:trueじゃなくても動くようにしたいけどとりあえず

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
    if (topicIDs.length === 0) {
      return new Map();
    }

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
              size: topicIDs.length,
            },
          },
        },
      },
    });

    const countArr: { key: string, doc_count: number }[] = data.aggregations.res_count.buckets;
    return new Map(countArr.map<[string, number]>(x => [x.key, x.doc_count]));
  }

  async replyCount(resIDs: string[]): Promise<Map<string, number>> {
    if (resIDs.length === 0) {
      return new Map();
    }
    const data = await ESClient.search({
      index: "reses",
      size: 0,
      body: {
        query: {
          nested: {
            path: "reply",
            query: {
              terms: {
                "reply.res": resIDs,
              },
            },
          },
        },
        aggs: {
          reply_count: {
            nested: {
              path: "reply",
            },
            aggs: {
              reply_count: {
                terms: {
                  field: "reply.res",
                  size: resIDs.length,
                },
              },
            },
          },
        },
      },
    });

    const countArr: { key: string, doc_count: number }[] = data.aggregations.reply_count.reply_count.buckets;
    return new Map(countArr.map<[string, number]>(x => [x.key, x.doc_count]));
  }

  private async aggregate(reses: IResDB[]): Promise<Res[]> {
    const count = await this.replyCount(reses.map(x => x.id));
    return reses.map(r => fromDBToRes(r, count.get(r.id) || 0));
  }
}
