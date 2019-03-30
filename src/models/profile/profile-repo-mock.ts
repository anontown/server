import { isNullish } from "@kgtkr/utils";
import { AtConflictError, AtNotFoundError } from "../../at-error";
import * as G from "../../generated/graphql";
import { AuthContainer } from "../../server/auth-container";
import { IProfileRepo } from "./iprofile-repo";
import { IProfileDB, Profile } from "./profile";

export class ProfileRepoMock implements IProfileRepo {
  private profiles: IProfileDB[] = [];

  async findOne(id: string): Promise<Profile> {
    const profile = this.profiles.find(x => x._id.toHexString() === id);

    if (profile === undefined) {
      throw new AtNotFoundError("プロフィールが存在しません");
    }

    return Profile.fromDB(profile);
  }

  async find(auth: AuthContainer, query: G.ProfileQuery): Promise<Profile[]> {
    const self = query.self ? auth.token.user : null;
    const profiles = this.profiles
      .filter(x => self === null || x.user.toHexString() === self)
      .filter(x => isNullish(query.id) || query.id.includes(x._id.toHexString()))
      .sort((a, b) => b.date.valueOf() - a.date.valueOf());

    return profiles.map(p => Profile.fromDB(p));
  }

  async insert(profile: Profile): Promise<void> {
    if (this.profiles.findIndex(x => x.sn === profile.sn) !== -1) {
      throw new AtConflictError("スクリーンネームが使われています");
    }

    this.profiles.push(profile.toDB());
  }

  async update(profile: Profile): Promise<void> {
    if (this.profiles.findIndex(x => x.sn === profile.sn && x._id.toHexString() !== profile.id) !== -1) {
      throw new AtConflictError("スクリーンネームが使われています");
    }

    this.profiles[this.profiles.findIndex(x => x._id.toHexString() === profile.id)] = profile.toDB();
  }
}
