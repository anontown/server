import { ObjectID, WriteError } from "mongodb";
import { AtConflictError, AtNotFoundError } from "../../at-error";
import { DB } from "../../db";
import { AuthContainer } from "../../server/auth-container";
import { IProfileRepo, ProfileQuery } from "./iprofile-repo";
import { IProfileDB, Profile } from "./profile";

export class ProfileRepo implements IProfileRepo {
  async findOne(id: string): Promise<Profile> {
    const db = await DB();
    const profile: IProfileDB | null = await db.collection("profiles")
      .findOne({ _id: new ObjectID(id) });

    if (profile === null) {
      throw new AtNotFoundError("プロフィールが存在しません");
    }

    return Profile.fromDB(profile);
  }

  async find(auth: AuthContainer, query: ProfileQuery): Promise<Profile[]> {
    const q: any = {};
    if (query.self) {
      q.user = new ObjectID(auth.token.user);
    }
    if (query.id !== undefined) {
      q._id = { $in: query.id.map(x => new ObjectID(x)) };
    }
    const db = await DB();
    const profiles: IProfileDB[] = await db.collection("profiles")
      .find(q)
      .sort({ date: -1 })
      .toArray();
    return profiles.map(p => Profile.fromDB(p));
  }

  async insert(profile: Profile): Promise<void> {
    const db = await DB();
    try {
      await db.collection("profiles").insert(profile.toDB());
    } catch (ex) {
      const e: WriteError = ex;
      if (e.code === 11000) {
        throw new AtConflictError("スクリーンネームが使われています");
      } else {
        throw e;
      }
    }
  }

  async update(profile: Profile): Promise<void> {
    const db = await DB();
    try {
      await db.collection("profiles").update({ _id: new ObjectID(profile.id) }, profile.toDB());
    } catch (ex) {
      const e: WriteError = ex;
      if (e.code === 11000) {
        throw new AtConflictError("スクリーンネームが使われています");
      } else {
        throw e;
      }
    }
  }
}
