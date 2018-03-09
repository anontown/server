import { IAuthToken } from "../../auth";
import { Profile } from "./profile";

export interface IProfileRepo {
  findOne(id: string): Promise<Profile>;
  findIn(ids: string[]): Promise<Profile[]>;
  findAll(authToken: IAuthToken): Promise<Profile[]>;
  insert(profile: Profile): Promise<void>;
  update(profile: Profile): Promise<void>;
}
