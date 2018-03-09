import { AtNotFoundError, AtNotFoundPartError, AtConflictError } from "../../at-error";
import { IAuthToken } from "../../auth";
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

  async findIn(ids: string[]): Promise<Profile[]> {
    const profiles = this.profiles
      .filter(x => ids.findIndex(id => x._id.toHexString() === id))
      .sort((a, b) => a.date.valueOf() - b.date.valueOf());

    if (profiles.length !== ids.length) {
      throw new AtNotFoundPartError("プロフィールが存在しません",
        profiles.map(x => x._id.toString()));
    }

    return profiles.map(p => Profile.fromDB(p));
  }

  async findAll(authToken: IAuthToken): Promise<Profile[]> {
    const profiles = this.profiles
      .filter(x => x.user.toHexString() === authToken.user)
      .sort((a, b) => a.date.valueOf() - b.date.valueOf());

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
