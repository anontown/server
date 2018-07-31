import { AuthContainer } from "../../server/auth-container";
import { Profile } from "./profile";

export interface IProfileRepo {
  findOne(id: string): Promise<Profile>;
  find(auth: AuthContainer, query: { self?: boolean, id?: string[] }): Promise<Profile[]>;
  insert(profile: Profile): Promise<void>;
  update(profile: Profile): Promise<void>;
}
