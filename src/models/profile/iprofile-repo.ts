import { IAuthToken } from "../../auth";
import { AuthContainer } from "../../server/auth-container";
import { Profile } from "./profile";

export interface IProfileRepo {
  findOne(id: string): Promise<Profile>;
  findIn(ids: string[]): Promise<Profile[]>;
  findAll(authToken: IAuthToken): Promise<Profile[]>;
  find(auth: AuthContainer, query: { self?: boolean, id?: string[] }): Promise<Profile[]>;
  insert(profile: Profile): Promise<void>;
  update(profile: Profile): Promise<void>;
}
