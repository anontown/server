import { ObjectID } from 'mongodb';
import { User } from './user';
import { Res } from './res';
import { History } from './history';
import { DB } from '../db';
import { IAuthToken } from '../auth';
import { AtError, StatusCode } from '../at-error'
import { Config } from '../config';
import { StringUtil } from '../util';
import { CronJob } from 'cron';
export interface ITopicDB {
  _id: ObjectID,
  title: string,
  tags: string[],
  text: string,
  mdtext: string,
  update: Date,
  date: Date,
  type: TopicType,
  ageUpdate: Date,
  active: boolean
}

export interface ITopicAPI {
  id: string,
  title: string,
  tags: string[],
  text: string,
  mdtext: string,
  update: string,
  date: string,
  resCount: number,
  type: TopicType,
  active: boolean
}

export type TopicType = "one" | "normal";

export class Topic {
  private constructor(private _id: ObjectID,
    private _title: string,
    private _tags: string[],
    private _text: string,
    private _mdtext: string,
    private _update: Date,
    private _date: Date,
    private _resCount: number,
    private _type: TopicType,
    private _ageUpdate: Date,
    private _active: boolean) {

  }

  get active(): boolean {
    return this._active;
  }

  get title(): string {
    return this._title;
  }

  get tags(): string[] {
    return this._tags;
  }

  get text(): string {
    return this._text;
  }

  get mdtext(): string {
    return this._mdtext;
  }

  static async findOne(id: ObjectID): Promise<Topic> {
    let db = await DB;
    let topic: ITopicDB | null = await db.collection("topics").findOne({ _id: id });

    if (topic === null) {
      throw new AtError(StatusCode.NotFound, "トピックが存在しません");
    }

    return (await this.aggregate([topic]))[0];
  }

  static async findIn(ids: ObjectID[]): Promise<Topic[]> {
    let db = await DB;

    let topics: ITopicDB[] = await db.collection("topics").find({ _id: { $in: ids } })
      .sort({ ageUpdate: -1 })
      .toArray();

    if (topics.length !== ids.length) {
      throw new AtError(StatusCode.NotFound, "トピックが存在しません");
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

  static async find(title: string, tags: string[], skip: number, limit: number, activeOnly: boolean): Promise<Topic[]> {
    let db = await DB;

    let topics: ITopicDB[] = await db.collection("topics")
      .find((() => {
        let query: any = {
          title: new RegExp(title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))
        };

        if(tags.length!==0){
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

  private static async aggregate(topics: ITopicDB[]): Promise<Topic[]> {
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

    return topics.map(t => this.fromDB(t, count.has(t._id.toString()) ? count.get(t._id.toString()) as number : 0));

  }

  static async insert(topic: Topic): Promise<null> {
    let db = await DB;
    await db.collection("topics").insert(topic.toDB());
    return null;
  }

  static async update(topic: Topic): Promise<null> {
    let db = await DB;
    await db.collection("topics").update({ _id: topic._id }, topic.toDB());
    return null;
  }

  toDB(): ITopicDB {
    return {
      _id: this._id,
      title: this._title,
      tags: this._tags,
      text: this._text,
      mdtext: this._mdtext,
      update: this._update,
      date: this._date,
      type: this._type,
      ageUpdate: this._ageUpdate,
      active: this._active
    }
  }

  toAPI(): ITopicAPI {
    return {
      id: this._id.toString(),
      title: this._title,
      tags: this._tags,
      text: this._text,
      mdtext: this._mdtext,
      update: this._update.toISOString(),
      date: this._date.toISOString(),
      resCount: this._resCount,
      type: this._type,
      active: this._active
    }
  }

  static fromDB(t: ITopicDB, resCount: number): Topic {
    return new Topic(t._id, t.title, t.tags, t.text, t.mdtext, t.update, t.date, resCount, t.type, t.ageUpdate, t.active);
  }


  get id(): ObjectID {
    return this._id;
  }

  resUpdate(res: Res) {
    if (!this._active) {
      throw new AtError(StatusCode.Forbidden, "トピックが落ちているので書き込めません")
    }

    this._update = res.date;
    if (res.age) {
      this._ageUpdate = res.date;
    }
  }

  static create(title: string, tags: string[], text: string, user: User, type: TopicType, authToken: IAuthToken): { topic: Topic, res: Res, history: History | null } {
    if (tags.length !== new Set(tags).size) {
      throw new AtError(StatusCode.MisdirectedRequest, "タグの重複があります");
    }
    var now = new Date();
    var topic = new Topic(new ObjectID(), title, tags, text, StringUtil.md(text), now, now, 1, type, now, true);
    let cd: { history: History | null, res: Res };
    if (type === "one") {
      cd = {
        history: null,
        res: Res.create(topic, user, authToken, "", "トピ主", "トピックが建ちました", null, null, true)
      };
      user.changeLastOneTopic(now);
    } else {
      cd = topic.changeData(user, authToken, title, tags, text);
      user.changeLastTopic(now);
    }
    return { topic, history: cd.history, res: cd.res };
  }

  static cron() {
    //毎時間トピ落ちチェック
    new CronJob({
      cronTime: '00 00 * * * *',
      onTick: async () => {
        let db = await DB;
        await db.collection("topics")
          .update({ type: "one", update: { $lt: new Date(Date.now() - 1000 * 60 * 60 * 24) }, active: true },
          { $set: { active: false } },
          { multi: true });
      },
      start: false,
      timeZone: 'Asia/Tokyo'
    }).start();
  }

  //{{setter
  changeData(user: User, authToken: IAuthToken, title: string, tags: string[], text: string): { res: Res, history: History } {
    user.usePoint(10);

    if (tags.length !== new Set(tags).size) {
      throw new AtError(StatusCode.MisdirectedRequest, "タグの重複があります");
    }
    if (this._type === "one") {
      throw new AtError(StatusCode.Forbidden, "単発トピックは編集出来ません");
    }
    if (!this._active) {
      throw new AtError(StatusCode.Forbidden, "トピックが落ちているので編集出来ません");
    }
    if (!title.match(Config.topic.title.regex)) {
      throw new AtError(StatusCode.MisdirectedRequest, Config.topic.title.msg);
    }
    if (tags.length > Config.topic.tags.max) {
      throw new AtError(StatusCode.MisdirectedRequest, Config.topic.tags.msg);
    }
    tags.forEach(x => {
      if (!x.match(Config.topic.tags.regex)) {
        throw new AtError(StatusCode.MisdirectedRequest, Config.topic.tags.msg);
      }
    });
    if (!text.match(Config.topic.text.regex)) {
      throw new AtError(StatusCode.MisdirectedRequest, Config.topic.text.msg);
    }

    let date = new Date();

    this._title = title;
    if (this._type === "normal") {
      this._tags = tags;
    }
    this._text = text;
    this._mdtext = StringUtil.md(text);

    let history = History.create(this, date, this.hash(date, user), user);
    let res = Res.create(this, user, authToken, "", "トピックデータ", "トピックデータが編集されました", null, null, true);

    return { res, history };
  }
  hash(date: Date, user: User): string {
    return StringUtil.hash(
      //ユーザー依存
      user.id + " " +

      //書き込み年月日依存
      date.getFullYear() + " " + date.getMonth() + " " + date.getDate() + " " +

      //トピ依存
      this._id +

      //ソルト依存
      Config.salt.hash);
  }
}
