import { ObjectID } from 'mongodb';
import { User } from '../user';
import { Topic } from '../topic';
import { DB } from '../../db';
import { AtError, StatusCode } from '../../at-error';

export interface IHistoryDB {
  _id: ObjectID,
  topic: ObjectID,
  title: string,
  tags: string[],
  text: string,
  mdtext: string,
  date: Date,
  hash: string,
  user: ObjectID
}

export interface IHistoryAPI {
  id: string,
  topic: string,
  title: string,
  tags: string[],
  text: string,
  mdtext: string,
  date: string,
  hash: string
}

export class History {
  private constructor(private _id: ObjectID,
    private _topic: ObjectID,
    private _title: string,
    private _tags: string[],
    private _text: string,
    private _mdtext: string,
    private _date: Date,
    private _hash: string,
    private _user: ObjectID) {

  }

  get id(): ObjectID {
    return this._id;
  }

  static async insert(history: History): Promise<null> {
    let db = await DB;
    await db.collection("histories").insert(history.toDB());
    return null;
  }

  static async update(history: History): Promise<null> {
    let db = await DB;
    await db.collection("histories").update({ _id: history._id }, history.toDB());
    return null;
  }

  static async findOne(id: ObjectID): Promise<History> {
    let db = await DB;
    let history: IHistoryDB | null = await db.collection("histories").findOne({ _id: id });
    if (history === null) {
      throw new AtError(StatusCode.NotFound, "編集履歴が存在しません");
    }

    return this.fromDB(history);
  }

  static async findIn(ids: ObjectID[]): Promise<History[]> {
    let db = await DB;
    let histories: IHistoryDB[] = await db.collection("histories")
      .find({ _id: { $in: ids } })
      .sort({ date: -1 })
      .toArray();

    if (histories.length !== ids.length) {
      throw new AtError(StatusCode.NotFound, "編集履歴が存在しません");
    }

    return histories.map(h => this.fromDB(h));
  }

  static async findAll(topic: Topic): Promise<History[]> {
    let db = await DB;
    let histories: IHistoryDB[] = await db.collection("histories")
      .find({ topic: topic.id })
      .sort({ date: -1 })
      .toArray();

    return histories.map(h => this.fromDB(h));
  }

  toDB(): IHistoryDB {
    return {
      _id: this._id,
      topic: this._topic,
      title: this._title,
      tags: this._tags,
      text: this._text,
      mdtext: this._mdtext,
      date: this._date,
      hash: this._hash,
      user: this._user
    }
  }

  toAPI(): IHistoryAPI {
    return {
      id: this._id.toString(),
      topic: this._topic.toString(),
      title: this._title,
      tags: this._tags,
      text: this._text,
      mdtext: this._mdtext,
      date: this._date.toISOString(),
      hash: this._hash
    };
  }

  static fromDB(h: IHistoryDB): History {
    return new History(h._id, h.topic, h.title, h.tags, h.text, h.mdtext, h.date, h.hash, h.user);
  }

  static create(topic: Topic, date: Date, hash: string, user: User): History {
    return new History(new ObjectID(), topic.id, topic.title, topic.tags, topic.text, topic.mdtext, date, hash, user.id);
  }
}
