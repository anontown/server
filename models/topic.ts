import * as marked from 'marked';
import { ObjectID } from 'mongodb';
import { User } from './user';
import { Res } from './res';
import { History } from './history';
import { DB } from '../db';
import { IAuthToken } from '../auth';
import { AtError, StatusCode } from '../at-error'
import { Config } from '../config';
import { StringUtil } from '../util';

interface ITopicDB {
  _id: ObjectID,
  title: string,
  category: string[],
  text: string,
  mdtext: string,
  update: Date,
  date: Date
}

export interface ITopicAPI {
  id: string,
  title: string,
  category: string[],
  text: string,
  mdtext: string,
  update: string,
  date: string,
  resCount: number
}

export class Topic {
  private constructor(private _id: ObjectID,
    private _title: string,
    private _category: string[],
    private _text: string,
    private _mdtext: string,
    private _update: Date,
    private _date: Date,
    private _resCount: number) {

  }

  get title(): string {
    return this._title;
  }

  get category(): string[] {
    return this._category;
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
      .sort({ update: -1 })
      .toArray();

    if (topics.length !== ids.length) {
      throw new AtError(StatusCode.NotFound, "トピックが存在しません");
    }

    return this.aggregate(topics);
  }

  static async find(title: string, category: string[], skip: number, limit: number): Promise<Topic[]> {
    let db = await DB;

    let topics: ITopicDB[] = await db.collection("topics")
      .find((() => {
        let query: any = {
          title: new RegExp(title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))
        };

        category.forEach((v, i) => {
          query["category." + i] = v;
        })

        return query;
      })())
      .sort({ update: -1 })
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
      category: this._category,
      text: this._text,
      mdtext: this._mdtext,
      update: this._update,
      date: this._date,
    }
  }

  toAPI(): ITopicAPI {
    return {
      id: this._id.toString(),
      title: this._title,
      category: this._category,
      text: this._text,
      mdtext: this._mdtext,
      update: this._update.toISOString(),
      date: this._date.toISOString(),
      resCount: this._resCount
    }
  }

  static fromDB(t: ITopicDB, resCount: number): Topic {
    return new Topic(t._id, t.title, t.category, t.text, t.mdtext, t.update, t.date, resCount);
  }


  get id(): ObjectID {
    return this._id;
  }

  set update(update: Date) {
    this._update = update;
  }

  static create(title: string, category: string[], text: string, user: User, authToken: IAuthToken): { topic: Topic, res: Res, history: History } {
    var now = new Date();
    var topic = new Topic(new ObjectID(), title, category, text, marked.parse(text, { sanitize: true }), now, now, 1);
    var cd = topic.changeData(user, authToken, title, category, text);
    user.changeLastTopic(now);
    return { topic, history: cd.history, res: cd.res };
  }

  //{{setter
  changeData(user: User, authToken: IAuthToken, title: string, category: string[], text: string): { res: Res, history: History } {
    user.usePoint(50);

    if (!title.match(Config.topic.title.regex)) {
      throw new AtError(StatusCode.MisdirectedRequest, Config.topic.title.msg);
    }
    if (category.length > Config.topic.category.max) {
      throw new AtError(StatusCode.MisdirectedRequest, Config.topic.category.msg);
    }
    category.forEach(x => {
      if (!x.match(Config.topic.category.regex)) {
        throw new AtError(StatusCode.MisdirectedRequest, Config.topic.category.msg);
      }
    });
    if (!text.match(Config.topic.text.regex)) {
      throw new AtError(StatusCode.MisdirectedRequest, Config.topic.text.msg);
    }

    let date = new Date();

    this._title = title;
    this._category = category;
    this._text = text;
    this._mdtext = marked.parse(text, { sanitize: true });

    let history = History.create(this, date, this.hash(date, user), user);
    let res = Res.create(this, user, authToken, "", "トピックデータ", "トピックデータが編集されました", null, null);

    return { res, history };
  }
  hash(date: Date, user: User): string {
    return StringUtil.hashShort(
      //ユーザー依存
      user.id + " " +

      //書き込み年月日依存
      date.getFullYear() + " " + date.getMonth() + " " + date.getDate() + " " +

      //トピ依存
      this._id +

      //ソルト依存
      Config.salt.hash);
  }

  inCategory(category: string[]): boolean {
    if (category.length > this._category.length) {
      //引数の方の長さが大きいなら
      return false;
    } else {
      //長さが同じならもしくは引数の方が短い
      for (let i = 0; i < category.length; i++) {
        if (category[i] !== this._category[i]) {
          return false;
        }
      }
    }

    return true;
  }
}
