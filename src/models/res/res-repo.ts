import { SearchResponse } from "elasticsearch";
import { Subject } from "rxjs";
import { AtNotFoundError, AtNotFoundPartError } from "../../at-error";
import { IAuthToken } from "../../auth";
import { Config } from "../../config";
import { ESClient } from "../../db";
import { Topic, TopicRepo } from "../topic";
import { IResRepo } from "./ires-repo";
import { fromDBToRes, IResDB, IResNormalDB, Res } from "./res";

export class ResRepo implements IResRepo {
  readonly insertEvent: Subject<{ res: Res, count: number }> = new Subject<{ res: Res, count: number }>();

  constructor(private topicRepo: TopicRepo) { }

  async findOne(id: string): Promise<Res> {
    const reses = await ESClient.search<IResDB["body"]>({
      index: "reses",
      size: 1,
      body: {
        query: {
          term: {
            _id: id,
          },
        },
      },
    });

    if (reses.hits.total === 0) {
      throw new AtNotFoundError("レスが存在しません");
    }

    return (await this.aggregate(reses))[0];
  }

  async findIn(ids: string[]): Promise<Res[]> {
    const reses = await ESClient.search<IResDB["body"]>({
      index: "reses",
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

    return this.aggregate(reses);
  }

  async find(topic: Topic, type: "before" | "after", equal: boolean, date: Date, limit: number): Promise<Res[]> {
    const reses = await ESClient.search<IResDB["body"]>({
      index: "reses",
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
                term: {
                  topic: topic.id,
                },
              },
            ],
          },
        },
        sort: { date: { order: type === "after" ? "asc" : "desc" } },
      },
    });

    const result = await this.aggregate(reses);
    if (type === "after") {
      result.reverse();
    }
    return result;
  }

  async findNew(topic: Topic, limit: number): Promise<Res[]> {
    const reses = await ESClient.search<IResDB["body"]>({
      index: "reses",
      size: limit,
      body: {
        query: {
          term: {
            topic: topic.id,
          },
        },
        sort: { date: { order: "desc" } },
      },
    });

    return await this.aggregate(reses);
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
                  [type === "after" ? (equal ? "gte" : "gt") : (equal ? "lte" : "lt")]: date.toISOString(),
                },
              },
              {
                term: {
                  "reply.user": authToken.user,
                },
              },
            ],
          },
        },
        sort: { date: { order: type === "after" ? "asc" : "desc" } },
      },
    });

    const result = await this.aggregate(reses);
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

    return await this.aggregate(reses);
  }

  async findHash(topic: Topic, hash: string): Promise<Res[]> {
    const reses = await ESClient.search<IResNormalDB["body"]>({
      index: "reses",
      type: "normal",
      size: Config.api.limit,
      body: {
        query: {
          term: {
            topic: topic.id,
            hash,
          },
        },
        sort: { date: { order: "desc" } },
      },
    });

    return await this.aggregate(reses);
  }

  async findReply(topic: Topic, res: Res): Promise<Res[]> {
    const reses = await ESClient.search<IResNormalDB["body"]>({
      index: "reses",
      type: "normal",
      size: Config.api.limit,
      body: {
        query: {
          term: {
            "topic": topic.id,
            "reply.res": res.id,
          },
        },
        sort: { date: { order: "desc" } },
      },
    });

    return await this.aggregate(reses);
  }

  async insert(res: Res): Promise<null> {
    const rDB = res.toDB();
    await ESClient.create({
      index: "reses",
      type: rDB.type,
      id: rDB.id,
      body: rDB.body,
    });

    const topic = await this.topicRepo.findOne(res.topic);
    this.insertEvent.next({ res, count: topic.resCount });

    return null;
  }

  async update(res: Res): Promise<null> {
    const rDB = res.toDB();
    await ESClient.update({
      index: "reses",
      type: rDB.type,
      id: rDB.id,
      body: rDB.body,
    });
    return null;
  }

  private async aggregate(reses: SearchResponse<IResDB["body"]>): Promise<Res[]> {
    const data = await ESClient.search({
      index: "reses",
      size: 0,
      body: {
        query: {
          terms: {
            id: reses.hits.hits.map(r => r._id),
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

    return reses.hits.hits.map(r => fromDBToRes({
      id: r._id,
      type: r._type,
      body: r._source,
    } as IResDB, count.get(r._id) || 0));
  }
}
