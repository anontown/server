import { CronJob } from "cron";
import { Refresh, GetResponse } from "elasticsearch";
import { AtNotFoundError, AtNotFoundPartError } from "../../at-error";
import { ESClient } from "../../db";
import { IResRepo } from "../res";
import { ITopicRepo } from "./itopic-repo";
import {
  ITopicDB,
  ITopicForkDB,
  ITopicNormalDB,
  ITopicOneDB,
  Topic,
  TopicFork,
  TopicNormal,
  TopicOne,
} from "./topic";

export class TopicRepo implements ITopicRepo {
  constructor(public resRepo: IResRepo, private refresh?: Refresh) { }

  async findOne(id: string): Promise<Topic> {
    let topic: GetResponse<ITopicDB["body"]>;
    try {
      topic = await ESClient.get<ITopicDB["body"]>({
        index: "topics",
        type: "doc",
        id,
      });
    } catch {
      throw new AtNotFoundError("レスが存在しません");
    }
    return (await this.aggregate([{ id: topic._id, body: topic._source } as ITopicDB]))[0];
  }

  async findIn(ids: string[]): Promise<Topic[]> {
    const topics = await ESClient.search<ITopicDB["body"]>({
      index: "topics",
      type: "doc",
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

    if (topics.hits.total !== ids.length) {
      throw new AtNotFoundPartError("トピックが存在しません",
        topics.hits.hits.map(t => t._id));
    }

    return this.aggregate(topics.hits.hits.map(x => ({ id: x._id, body: x._source }) as ITopicDB));
  }

  async findTags(limit: number): Promise<{ name: string, count: number }[]> {
    if (limit === 0) {
      return [];
    }

    const data = await ESClient.search({
      index: "topics",
      size: 0,
      body: {
        aggs: {
          tags_count: {
            terms: {
              field: "tags",
              size: limit,
            },
          },
        },
      },
    });

    const tags: { key: string, doc_count: number }[] = data.aggregations.tags_count.buckets;

    return tags.map(x => ({ name: x.key, count: x.doc_count }));
  }

  async find(
    title: string,
    tags: string[],
    skip: number,
    limit: number,
    activeOnly: boolean): Promise<Topic[]> {
    const topics = await ESClient.search<ITopicOneDB["body"] | ITopicNormalDB["body"]>({
      index: "topics",
      size: limit,
      from: skip,
      body: {
        query: {
          bool: {
            filter: [
              {
                match: {
                  title: {
                    query: title,
                    operator: "and",
                    zero_terms_query: "all"
                  },
                },
              },
              ...tags.map(t => ({
                term: {
                  tags: t,
                }
              })),
              {
                terms: {
                  type: ["normal", "one"],
                },
              },
              ...activeOnly ? [{ term: { active: true } }] : [],

            ],
          },
        },
        sort: { ageUpdate: { order: "desc" } },
      },
    });

    return this.aggregate(topics.hits.hits.map(x => ({ id: x._id, body: x._source })));
  }

  async findFork(parent: TopicNormal, skip: number, limit: number, activeOnly: boolean): Promise<Topic[]> {
    const topics = await ESClient.search<ITopicForkDB["body"]>({
      index: "topics",
      size: limit,
      from: skip,
      body: {
        query: {
          bool: {
            filter: [
              {
                match: {
                  parent: parent.id
                }
              },
              {
                term: {
                  type: "fork",
                },
              },
              ...activeOnly ? [{ match: { active: true } }] : [],
            ],
          },
        },
        sort: { ageUpdate: { order: "desc" } },
      },
    });

    return this.aggregate(topics.hits.hits.map(x => ({ id: x._id, body: x._source })));
  }

  async cronTopicCheck(now: Date): Promise<void> {
    await ESClient.updateByQuery({
      index: "topics",
      type: "doc",
      body: {
        script: {
          inline: "ctx._source.active = false",
        },
        query: {
          range: {
            update: {
              lt: new Date(now.valueOf() - 1000 * 60 * 60 * 24).toISOString(),
            },
          },
          terms: {
            type: ["one", "fork"],
          },
        },
      },
    });
  }

  cron() {
    // 毎時間トピ落ちチェック
    new CronJob({
      cronTime: "00 00 * * * *",
      onTick: async () => {
        await this.cronTopicCheck(new Date());
      },
      start: false,
      timeZone: "Asia/Tokyo",
    }).start();
  }

  async insert(topic: Topic): Promise<void> {
    const tDB = topic.toDB();
    await ESClient.create({
      index: "topics",
      type: "doc",
      id: tDB.id,
      body: tDB.body,
      refresh: this.refresh,
    });
  }

  async update(topic: Topic): Promise<void> {
    const tDB = topic.toDB();
    await ESClient.index({
      index: "topics",
      type: "doc",
      id: tDB.id,
      body: tDB.body,
      refresh: this.refresh !== undefined ? this.refresh.toString() : undefined,
    });
  }

  private async aggregate(topics: ITopicDB[]): Promise<Topic[]> {
    const count = await this.resRepo.resCount(topics.map(x => x.id));

    return topics.map(x => {
      const c = count.get(x.id) || 0;
      switch (x.body.type) {
        case "normal":
          return TopicNormal.fromDB({ id: x.id, body: x.body }, c);
        case "one":
          return TopicOne.fromDB({ id: x.id, body: x.body }, c);
        case "fork":
          return TopicFork.fromDB({ id: x.id, body: x.body }, c);
      }
    });

  }
}
