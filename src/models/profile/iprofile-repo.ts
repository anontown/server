import { IAuthToken } from "../../auth";
import { Profile } from "./profile";
import { AuthContainer } from "../../server/auth-container";

export interface IProfileRepo {
  findOne(id: string): Promise<Profile>;
  findIn(ids: string[]): Promise<Profile[]>;
  findAll(authToken: IAuthToken): Promise<Profile[]>;
  find(auth: AuthContainer, query: { self: boolean | null, id: string[] }): Promise<Profile[]>;
  insert(profile: Profile): Promise<void>;
  update(profile: Profile): Promise<void>;
}
