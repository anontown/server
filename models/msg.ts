import { ObjectID } from 'mongodb';
import * as marked from 'marked';
import { User } from './user';
import { DB } from '../db';
import { IAuthToken } from '../auth';
import { AtError, StatusCode } from '../at-error';

interface IMsgDB {
  _id: ObjectID,
  receiver: ObjectID | null,
  text: string,
  mdtext: string,
  date: Date
}

export interface IMsgAPI {
  id: string,
  receiver: string | null,
  text: string,
  mdtext: string,
  date: string
}

export class Msg {
  private constructor(private _id: ObjectID,
    private _receiver: ObjectID | null,
    private _text: string,
    private _mdtext: string,
    private _date: Date) {

  }


  static async findOne(authToken: IAuthToken, id: ObjectID): Promise<Msg> {
    let db = await DB;
    let msg: IMsgDB | null = await db.collection("msgs").findOne({
      _id: { $in: id },
      $or: [{ user: authToken.id }, { user: null }]
    });

    if (msg === null) {
      throw new AtError(StatusCode.NotFound, "メッセージが存在しません");
    }

    return this.fromDB(msg);
  }

  static async findIn(authToken: IAuthToken, ids: ObjectID[]): Promise<Msg[]> {
    let db = await DB;
    let msgs: IMsgDB[] = await db.collection("msgs").find({
      _id: { $in: ids },
      $or: [{ user: authToken.id }, { user: null }]
    }).sort({ date: -1 })
      .toArray();

    if (msgs.length !== ids.length) {
      throw new AtError(StatusCode.NotFound, "メッセージが存在しません");
    }

    return msgs.map(m => this.fromDB(m));
  }

  static async find(authToken: IAuthToken, type: "before" | "after", equal: boolean, date: Date, limit: number): Promise<Msg[]> {
    let db = await DB;

    let msgs: IMsgDB[] = await db.collection("msgs")
      .find({
        $or: [{ user: authToken.id }, { user: null }],
        date: { [type === "after" ? (equal ? "$gte" : "$gt") : (equal ? "$lte" : "$lt")]: date }
      })
      .sort({ date: type === "after" ? 1 : -1 })
      .skip(0)
      .limit(limit)
      .sort({ date: -1 })
      .toArray();


    return msgs.map(m => this.fromDB(m));
  }

  static async findNew(authToken: IAuthToken, limit: number): Promise<Msg[]> {
    let db = await DB;

    let msgs: IMsgDB[] = await db.collection("msgs")
      .find({
        $or: [{ user: authToken.id }, { user: null }]
      })
      .sort({ date: -1 })
      .skip(0)
      .limit(limit)
      .toArray();

    return msgs.map(m => this.fromDB(m));
  }

  static async insert(msg: Msg): Promise<null> {
    let db = await DB;
    await db.collection("msgs").insert(msg.toDB());
    return null;
  }

  static async update(msg: Msg): Promise<null> {
    let db = await DB;
    await db.collection("msgs").update({ _id: msg._id }, msg.toDB());
    return null;
  }

  toDB(): IMsgDB {
    return {
      _id: this._id,
      receiver: this._receiver,
      text: this._text,
      mdtext: this._mdtext,
      date: this._date
    }
  }

  toAPI(): IMsgAPI {
    return {
      id: this._id.toString(),
      receiver: this._receiver !== null ? this._receiver.toString() : null,
      text: this._text,
      mdtext: this._mdtext,
      date: this._date.toISOString()
    }
  }

  static fromDB(m: IMsgDB): Msg {
    return new Msg(m._id, m.receiver, m.text, m.mdtext, m.date);
  }

  static create(receiver: User | null, text: string): Msg {
    return new Msg(new ObjectID(),
      receiver !== null ? receiver.id : null,
      text,
      marked.parse(text, { sanitize: true }),
      new Date());
  }
}