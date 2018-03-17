import { CronJob } from "cron";
import { SearchResponse } from "elasticsearch";
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
  constructor(private resRepo: IResRepo) { }

  async findOne(id: string): Promise<Topic> {
    const topics = await ESClient.search<ITopicDB["body"]>({
      index: "topics",
      size: 1,
      body: {
        query: {
          term: {
            _id: id,
          },
        },
      },
    });

    if (topics.hits.total === 0) {
      throw new AtNotFoundError("トピックが存在しません");
    }

    return (await this.aggregate(topics))[0];
  }

  async findIn(ids: string[]): Promise<Topic[]> {
    const topics = await ESClient.search<ITopicDB["body"]>({
      index: "topics",
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

    return this.aggregate(topics);
  }

  async findTags(limit: number): Promise<{ name: string, count: number }[]> {
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
    titles: string[],
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
              ...titles.map(t => ({ match: { title: t } })),
              ...tags.map(t => ({ match: { tags: t } })),
              ...activeOnly ? [{ match: { active: true } }] : [],
            ],
          },
          terms: {
            type: ["normal", "one"]
          }
        },
        sort: { ageUpdate: { order: "desc" } },
      },
    });

    return this.aggregate(topics);
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
              { match: { parent: parent.id } },
              ...activeOnly ? [{ match: { active: true } }] : [],
            ],
          },
          term: {
            type: "fork",
          }
        },
        sort: { ageUpdate: { order: "desc" } },
      },
    });

    return this.aggregate(topics);
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
          }
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
    });
  }

  async update(topic: Topic): Promise<void> {
    const tDB = topic.toDB();
    await ESClient.update({
      index: "topics",
      type: "doc",
      id: tDB.id,
      body: tDB.body,
    });
  }

  private async aggregate(topics: SearchResponse<ITopicDB["body"]>): Promise<Topic[]> {
    const dbs = topics.hits.hits.map(x => ({ id: x._id, body: x._source }) as ITopicDB);
    const count = await this.resRepo.resCount(dbs.map(x => x.id));

    return dbs.map(x => {
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
