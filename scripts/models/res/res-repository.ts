import { ObjectID } from 'mongodb';
import { Topic } from '../topic';
import { DB } from '../../db';
import { IAuthToken } from '../../auth';
import { AtNotFoundError, AtNotFoundPartError } from '../../at-error'
import { Res, IResDB } from './res';
import { Subject } from "rxjs";

export class ResRepository {
  static insertEvent = new Subject<Res>();

  static async findOne(id: ObjectID): Promise<Res> {
    let db = await DB;
    let res: IResDB | null = await db.collection("reses").findOne({ _id: id });

    if (res === null) {
      throw new AtNotFoundError("レスが存在しません");
    }

    return (await this.aggregate([res]))[0];
  }

  static async findIn(ids: ObjectID[]): Promise<Res[]> {
    let db = await DB;
    let reses: IResDB[] = await db.collection("reses").find({ _id: { $in: ids } })
      .sort({ date: -1 })
      .toArray();

    if (reses.length !== ids.length) {
      throw new AtNotFoundPartError("レスが存在しません",
        reses.map(x => x._id.toString()));
    }

    return this.aggregate(reses);
  }

  static async find(topic: Topic, type: "before" | "after", equal: boolean, date: Date, limit: number): Promise<Res[]> {
    let db = await DB;
    let reses: IResDB[] = await db.collection("reses")
      .find({
        topic: topic.id,
        date: { [type === "after" ? (equal ? "$gte" : "$gt") : (equal ? "$lte" : "$lt")]: date }
      })
      .sort({ date: type === "after" ? 1 : -1 })
      .skip(0)
      .limit(limit)
      .toArray();
    if (type === "after") {
      reses.reverse();
    }

    return this.aggregate(reses);
  }

  static async findNew(topic: Topic, limit: number): Promise<Res[]> {
    let db = await DB;
    let reses: IResDB[] = await db.collection("reses")
      .find({
        topic: topic.id,
      })
      .sort({ date: -1 })
      .skip(0)
      .limit(limit)
      .toArray();


    return this.aggregate(reses);
  }

  static async findNotice(authToken: IAuthToken, type: "before" | "after", equal: boolean, date: Date, limit: number): Promise<Res[]> {
    let db = await DB;
    let reses: IResDB[] = await db.collection("reses")
      .find({
        "reply.user": authToken.user,
        date: { [type === "after" ? (equal ? "$gte" : "$gt") : (equal ? "$lte" : "$lt")]: date }
      })
      .sort({ date: type === "after" ? 1 : -1 })
      .skip(0)
      .limit(limit)
      .sort({ date: -1 })
      .toArray();


    return this.aggregate(reses);
  }

  static async findNoticeNew(authToken: IAuthToken, limit: number): Promise<Res[]> {
    let db = await DB;
    let reses: IResDB[] = await db.collection("reses")
      .find({
        "reply.user": authToken.user
      })
      .sort({ date: -1 })
      .skip(0)
      .limit(limit)
      .toArray();

    return this.aggregate(reses);
  }

  static async findHash(topic: Topic, hash: string): Promise<Res[]> {
    let db = await DB;
    let reses: IResDB[] = await db.collection("reses")
      .find({
        topic: topic.id,
        hash: hash
      })
      .sort({ date: -1 })
      .toArray();

    return this.aggregate(reses);
  }

  static async findReply(topic: Topic, res: Res): Promise<Res[]> {
    let db = await DB;
    let reses: IResDB[] = await db.collection("reses")
      .find({
        topic: topic.id,
        "reply.res": res.id
      })
      .sort({ date: -1 })
      .toArray();

    return this.aggregate(reses);
  }

  private static async aggregate(reses: IResDB[]): Promise<Res[]> {
    let db = await DB;
    let countArr: { _id: ObjectID, replyCount: number }[] = await db.collection("reses")
      .aggregate([
        {
          $group: {
            _id: "$reply.res", replyCount: { $sum: 1 }
          }
        },
        {
          $match: {
            _id: { $in: reses.map(x => x._id) }
          }
        }
      ])
      .toArray();

    let count = new Map<string, number>();
    countArr.forEach(r => count.set(r._id.toString(), r.replyCount));

    return reses.map(r => Res.fromDB(r,
      count.has(r._id.toString()) ? count.get(r._id.toString()) as number : 0));
  }

  static async insert(res: Res): Promise<null> {
    let db = await DB;
    await db.collection("reses").insert(res.toDB());
    ResRepository.insertEvent.next(res);
    return null;
  }

  static async update(res: Res): Promise<null> {
    let db = await DB;
    await db.collection("reses").update({ _id: res.id }, res.toDB());
    return null;
  }
}