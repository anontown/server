import { ObjectID, WriteError } from "mongodb";
import { AtConflictError, AtNotFoundError, AtNotFoundPartError } from "../../at-error";
import { IAuthToken } from "../../auth";
import { DB } from "../../db";
import { IProfileRepo } from "./iprofile-repo";
import { IProfileDB, Profile } from "./profile";

export class ProfileRepo implements IProfileRepo {
  async findOne(id: string): Promise<Profile> {
    const db = await DB;
    const profile: IProfileDB | null = await db.collection("profiles")
      .findOne({ _id: new ObjectID(id) });

    if (profile === null) {
      throw new AtNotFoundError("プロフィールが存在しません");
    }

    return Profile.fromDB(profile);
  }

  async findIn(ids: string[]): Promise<Profile[]> {
    const db = await DB;
    const profiles: IProfileDB[] = await db.collection("profiles")
      .find({ _id: { $in: ids.map(id => new ObjectID(id)) } })
      .sort({ date: -1 })
      .toArray();

    if (profiles.length !== ids.length) {
      throw new AtNotFoundPartError("プロフィールが存在しません",
        profiles.map(x => x._id.toString()));
    }

    return profiles.map(p => Profile.fromDB(p));
  }

  async findAll(authToken: IAuthToken): Promise<Profile[]> {
    const db = await DB;
    const profiles: IProfileDB[] = await db.collection("profiles")
      .find({ user: new ObjectID(authToken.user) })
      .sort({ date: -1 })
      .toArray();
    return profiles.map(p => Profile.fromDB(p));
  }

  async insert(profile: Profile): Promise<void> {
    const db = await DB;
    try {
      await db.collection("profiles").insert(profile.toDB());
    } catch (ex) {
      let e: WriteError = ex;
      if (e.code === 11000) {
        throw new AtConflictError("スクリーンネームが使われています");
      } else {
        throw e;
      }
    }
  }

  async update(profile: Profile): Promise<void> {
    const db = await DB;
    try {
      await db.collection("profiles").update({ _id: new ObjectID(profile.id) }, profile.toDB())
    } catch (ex) {
      let e: WriteError = ex;
      if (e.code === 11000) {
        throw new AtConflictError("スクリーンネームが使われています");
      } else {
        throw e;
      }
    }
  }
}
