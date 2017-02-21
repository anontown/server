import { ObjectID, WriteError } from 'mongodb';
import { DB } from '../../db';
import { IAuthToken } from '../../auth';
import { AtError, StatusCode } from '../../at-error'
import { Profile,IProfileDB } from './profile';

export class ProfileRepository{
    static async findOne(id: ObjectID): Promise<Profile> {
    let db = await DB;
    let profile: IProfileDB | null = await db.collection("profiles")
      .findOne({ _id: id });

    if (profile === null) {
      throw new AtError(StatusCode.NotFound, "プロフィールが存在しません");
    }

    return Profile.fromDB(profile);
  }

  static async findIn(ids: ObjectID[]): Promise<Profile[]> {
    let db = await DB;
    let profiles: IProfileDB[] = await db.collection("profiles")
      .find({ _id: { $in: ids } })
      .sort({ date: -1 })
      .toArray();

    if (profiles.length !== ids.length) {
      throw new AtError(StatusCode.NotFound, "プロフィールが存在しません");
    }

    return profiles.map(p => Profile.fromDB(p));
  }

  static async findAll(authToken: IAuthToken): Promise<Profile[]> {
    let db = await DB;
    let profiles: IProfileDB[] = await db.collection("profiles")
      .find({ user: authToken.user })
      .sort({ date: -1 })
      .toArray();
    return profiles.map(p => Profile.fromDB(p));
  }

  static async insert(profile: Profile): Promise<null> {
    let db = await DB;
    await db.collection("profiles").insert(profile.toDB()).catch((e: WriteError) => {
      if (e.code === 11000) {
        throw new AtError(StatusCode.Conflict, "スクリーンネームが使われています");
      } else {
        throw e;
      }
    });
    return null;
  }

  static async update(profile: Profile): Promise<null> {
    let db = await DB;
    await db.collection("profiles").update({ _id: profile.id }, profile.toDB()).catch((e: WriteError) => {
      if (e.code === 11000) {
        throw new AtError(StatusCode.Conflict, "スクリーンネームが使われています");
      } else {
        throw e;
      }
    });
    return null;
  }
}