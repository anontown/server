import { History, IHistoryDB } from './history';
import { DB } from '../../db';
import { AtNotFoundError, AtNotFoundPartError } from '../../at-error';
import { ObjectID } from 'mongodb';
import { ITopic } from '../topic';

export class HistoryRepository {
  static async insert(history: History): Promise<null> {
    let db = await DB;
    await db.collection("histories").insert(history.toDB());
    return null;
  }

  static async update(history: History): Promise<null> {
    let db = await DB;
    await db.collection("histories").update({ _id: history.id }, history.toDB());
    return null;
  }

  static async findOne(id: ObjectID): Promise<History> {
    let db = await DB;
    let history: IHistoryDB | null = await db.collection("histories").findOne({ _id: id });
    if (history === null) {
      throw new AtNotFoundError("編集履歴が存在しません");
    }

    return History.fromDB(history);
  }

  static async findIn(ids: ObjectID[]): Promise<History[]> {
    let db = await DB;
    let histories: IHistoryDB[] = await db.collection("histories")
      .find({ _id: { $in: ids } })
      .sort({ date: -1 })
      .toArray();

    if (histories.length !== ids.length) {
      throw new AtNotFoundPartError("編集履歴が存在しません",
        histories.map(x => x._id.toString()));
    }

    return histories.map(h => History.fromDB(h));
  }

  static async findAll(topic: ITopic): Promise<History[]> {
    let db = await DB;
    let histories: IHistoryDB[] = await db.collection("histories")
      .find({ topic: topic.id })
      .sort({ date: -1 })
      .toArray();

    return histories.map(h => History.fromDB(h));
  }
}