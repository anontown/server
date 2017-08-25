import { ObjectID } from 'mongodb';
import { DB } from '../../db';
import { IAuthToken } from '../../auth';
import { AtNotFoundError, AtNotFoundPartError } from '../../at-error';
import { IMsgDB, Msg } from './msg';
export class MsgRepository {
  static async findOne(authToken: IAuthToken, id: ObjectID): Promise<Msg> {
    let db = await DB;
    let msg: IMsgDB | null = await db.collection("msgs").findOne({
      _id: { $in: id },
      $or: [{ receiver: authToken.user }, { receiver: null }]
    });

    if (msg === null) {
      throw new AtNotFoundError("メッセージが存在しません");
    }

    return Msg.fromDB(msg);
  }

  static async findIn(authToken: IAuthToken, ids: ObjectID[]): Promise<Msg[]> {
    let db = await DB;
    let msgs: IMsgDB[] = await db.collection("msgs").find({
      _id: { $in: ids },
      $or: [{ receiver: authToken.user }, { receiver: null }]
    }).sort({ date: -1 })
      .toArray();

    if (msgs.length !== ids.length) {
      throw new AtNotFoundPartError("メッセージが存在しません", msgs.map(x => x._id.toString()));
    }

    return msgs.map(m => Msg.fromDB(m));
  }

  static async find(authToken: IAuthToken, type: "before" | "after", equal: boolean, date: Date, limit: number): Promise<Msg[]> {
    let db = await DB;

    let msgs: IMsgDB[] = await db.collection("msgs")
      .find({
        $or: [{ receiver: authToken.user }, { receiver: null }],
        date: { [type === "after" ? (equal ? "$gte" : "$gt") : (equal ? "$lte" : "$lt")]: date }
      })
      .sort({ date: type === "after" ? 1 : -1 })
      .skip(0)
      .limit(limit)
      .sort({ date: -1 })
      .toArray();


    return msgs.map(m => Msg.fromDB(m));
  }

  static async findNew(authToken: IAuthToken, limit: number): Promise<Msg[]> {
    let db = await DB;

    let msgs: IMsgDB[] = await db.collection("msgs")
      .find({
        $or: [{ receiver: authToken.user }, { receiver: null }]
      })
      .sort({ date: -1 })
      .skip(0)
      .limit(limit)
      .toArray();

    return msgs.map(m => Msg.fromDB(m));
  }

  static async insert(msg: Msg): Promise<null> {
    let db = await DB;
    await db.collection("msgs").insert(msg.toDB());
    return null;
  }

  static async update(msg: Msg): Promise<null> {
    let db = await DB;
    await db.collection("msgs").update({ _id: msg.id }, msg.toDB());
    return null;
  }
}