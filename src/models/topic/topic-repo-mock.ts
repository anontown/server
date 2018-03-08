import { CronJob } from "cron";
import { SearchResponse } from "elasticsearch";
import { AtNotFoundError, AtNotFoundPartError } from "../../at-error";
import { ESClient } from "../../db";
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

export class TopicRepoMock implements ITopicRepo {
  private topics: ITopicDB[] = [];

  async findOne(id: string): Promise<Topic> {
    const topic = this.topics.find(x => x.id === id);

    if (topic === undefined) {
      throw new AtNotFoundError("トピックが存在しません");
    }

    return (await this.aggregate([topic]))[0];
  }

  async findIn(ids: string[]): Promise<Topic[]> {
    const topics = this.topics.filter(x => ids.findIndex(id => x.id === id))
      .sort((a, b) => new Date(a.body.date).valueOf() - new Date(b.body.date).valueOf());

    if (topics.length !== ids.length) {
      throw new AtNotFoundPartError("トピックが存在しません",
        topics.map(t => t.id));
    }

    return this.aggregate(topics);
  }

  async findTags(limit: number): Promise<{ name: string, count: number }[]> {
    return Array.from(this.topics
      .map(x => x.type !== "fork" ? x.body.tags : [])
      .reduce((a, b) => a.concat(...b), [])
      .reduce((a, b) => a.set(b, (a.get(b) || 0) + 1), new Map<string, number>()))
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  async find(
    titles: string[],
    tags: string[],
    skip: number,
    limit: number,
    activeOnly: boolean): Promise<Topic[]> {
    return this.aggregate(this.topics.filter<ITopicNormalDB | ITopicOneDB>
      ((x): x is ITopicNormalDB | ITopicOneDB => x.type === "normal" || x.type === "one")
      .filter(x => titles.every(t => x.body.title.includes(t)))
      .filter(x => tags.every(t => x.body.tags.includes(t)))
      .filter(x => activeOnly || x.body.active)
      .sort((a, b) => new Date(a.body.ageUpdate).valueOf() - new Date(b.body.ageUpdate).valueOf())
      .slice(skip)
      .slice(0, limit));
  }

  async findFork(parent: TopicNormal, skip: number, limit: number, activeOnly: boolean): Promise<Topic[]> {
    return this.aggregate(this.topics.filter<ITopicForkDB>
      ((x): x is ITopicForkDB => x.type === "fork")
      .filter(x => x.body.parent === parent.id)
      .filter(x => activeOnly || x.body.active)
      .sort((a, b) => new Date(a.body.ageUpdate).valueOf() - new Date(b.body.ageUpdate).valueOf())
      .slice(skip)
      .slice(0, limit));
  }

  cron() {
    // 毎時間トピ落ちチェック
    new CronJob({
      cronTime: "00 00 * * * *",
      onTick: () => {
        const topics = this.topics.filter<ITopicNormalDB | ITopicOneDB>
          ((x): x is ITopicNormalDB | ITopicOneDB => x.type === "normal" || x.type === "one")
          .filter(x => new Date(x.body.update).valueOf() < new Date(Date.now() - 1000 * 60 * 60 * 24).valueOf())
          .map(x => ({ ...x, body: { ...x.body, active: false } }))
          .forEach(x => {
            this.topics[this.topics.findIndex(y => y.id === x.id)] = x;
          });
      },
      start: false,
      timeZone: "Asia/Tokyo",
    }).start();
  }

  async insert(topic: Topic): Promise<null> {
    this.topics.push(topic.toDB());
    return null;
  }

  async update(topic: Topic): Promise<null> {
    this.topics[this.topics.findIndex(x => x.id === topic.id)] = topic.toDB();
    return null;
  }

  private async aggregate(topics: ITopicDB[]): Promise<Topic[]> {
    const data = await ESClient.search({
      index: "reses",
      size: 0,
      body: {
        query: {
          terms: {
            topic: topics.map(t => t.id),
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
    const count = new Map(countArr.map<[string, number]>(x => [x.key, x.doc_count]));

    return topics.map(t => {
      const c = count.get(t.id) || 0;
      switch (t.type) {
        case "normal":
          return TopicNormal.fromDB(t, c);
        case "one":
          return TopicOne.fromDB(t, c);
        case "fork":
          return TopicFork.fromDB(t, c);
      }
    });

  }
}
