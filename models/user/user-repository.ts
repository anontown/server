import { ObjectID, WriteError } from 'mongodb';
import { DB } from '../../db';
import { AtError, StatusCode } from '../../at-error'
import { User, IUserDB } from './user';

export class UserRepository {
  static async findOne(id: ObjectID): Promise<User> {
    let db = await DB;
    let user: IUserDB | null = await db.collection("users").findOne({ _id: id });

    if (user === null) {
      throw new AtError(StatusCode.NotFound, "ユーザーが存在しません");
    }

    return User.fromDB(user);
  }

  static async findID(sn: string): Promise<ObjectID> {
    let db = await DB;
    let user: IUserDB | null = await db.collection("users").findOne({ sn });

    if (user === null) {
      throw new AtError(StatusCode.NotFound, "ユーザーが存在しません");
    }

    return user._id;
  }
  static async insert(user: User): Promise<null> {
    let db = await DB;
    await db.collection("users").insert(user.toDB()).catch((e: WriteError) => {
      if (e.code === 11000) {
        throw new AtError(StatusCode.Conflict, "スクリーンネームが使われています");
      } else {
        throw e;
      }
    });
    return null;
  }

  static async update(user: User): Promise<null> {
    let db = await DB;
    await db.collection("users").update({ _id: user.id }, user.toDB()).catch((e: WriteError) => {
      if (e.code === 11000) {
        throw new AtError(StatusCode.Conflict, "スクリーンネームが使われています");
      } else {
        throw e;
      }
    });
    return null;
  }
}