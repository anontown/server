import { ObjectID } from 'mongodb';
import { DB } from '../../db';
import { AtNotFoundError, AtNotFoundPartError } from '../../at-error'
import { Topic, ITopicDB, ITopic, ITopicNormal } from './topic';
import { CronJob } from 'cron';


export class TopicRepository {
  static async findOne(id: ObjectID): Promise<ITopic> {
    let db = await DB;
    let topic: ITopicDB | null = await db.collection("topics").findOne({ _id: id });

    if (topic === null) {
      throw new AtNotFoundError("トピックが存在しません");
    }

    return (await this.aggregate([topic]))[0];
  }

  static async findIn(ids: ObjectID[]): Promise<ITopic[]> {
    let db = await DB;

    let topics: ITopicDB[] = await db.collection("topics").find({ _id: { $in: ids } })
      .sort({ ageUpdate: -1 })
      .toArray();

    if (topics.length !== ids.length) {
      throw new AtNotFoundPartError("トピックが存在しません",
        topics.map(x => x._id.toString()));
    }

    return this.aggregate(topics);
  }

  static async findTags(limit: number): Promise<{ name: string, count: number }[]> {
    let db = await DB;

    let data: { _id: string, count: number }[] = await db.collection("topics")
      .aggregate([
        { $unwind: "$tags" },
        { $group: { _id: "$tags", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit }
      ])
      .toArray();

    return data.map(x => ({ name: x._id, count: x.count }));
  }

  static async find(title: string, tags: string[], skip: number, limit: number, activeOnly: boolean): Promise<ITopic[]> {
    let db = await DB;

    let topics: ITopicDB[] = await db.collection("topics")
      .find((() => {
        let query: any = {
          title: new RegExp(title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))
        };

        if (tags.length !== 0) {
          query["tags"] = { $all: tags };
        }

        query["type"] = { $in: ["normal", "one"] };

        if (activeOnly) {
          query["active"] = true;
        }

        return query;
      })())
      .sort({ ageUpdate: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return this.aggregate(topics);
  }

  static async findFork(parent: ITopicNormal, skip: number, limit: number, activeOnly: boolean): Promise<ITopic[]> {
    let db = await DB;

    let topics: ITopicDB[] = await db.collection("topics")
      .find((() => {
        let query: any = {};

        query['parent'] = parent.id;
        query["type"] = 'fork';
        if (activeOnly) {
          query["active"] = true;
        }

        return query;
      })())
      .sort({ ageUpdate: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return this.aggregate(topics);
  }

  private static async aggregate(topics: ITopicDB[]): Promise<ITopic[]> {
    let db = await DB;
    let countArr: { _id: ObjectID, resCount: number }[] = await db.collection("reses")
      .aggregate([
        {
          $group: {
            _id: "$topic", resCount: { $sum: 1 }
          }
        },
        {
          $match: {
            _id: { $in: topics.map(t => t._id) }
          }
        }
      ])
      .toArray();

    let count = new Map<string, number>();
    countArr.forEach(c => count.set(c._id.toString(), c.resCount));

    return topics.map(t => Topic.fromDB(t, count.has(t._id.toString()) ? count.get(t._id.toString()) as number : 0));

  }

  static cron() {
    //毎時間トピ落ちチェック
    new CronJob({
      cronTime: '00 00 * * * *',
      onTick: async () => {
        let db = await DB;
        await db.collection("topics")
          .update({ type: { $in: ["one", "fork"] }, update: { $lt: new Date(Date.now() - 1000 * 60 * 60 * 24) }, active: true },
          { $set: { active: false } },
          { multi: true });
      },
      start: false,
      timeZone: 'Asia/Tokyo'
    }).start();
  }

  static async insert(topic: ITopic): Promise<null> {
    let db = await DB;
    await db.collection("topics").insert(Topic.toDB(topic));
    return null;
  }

  static async update(topic: ITopic): Promise<null> {
    let db = await DB;
    await db.collection("topics").update({ _id: topic.id }, Topic.toDB(topic));
    return null;
  }
}