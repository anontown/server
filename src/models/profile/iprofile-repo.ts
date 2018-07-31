import { AuthContainer } from "../../server/auth-container";
import { Profile } from "./profile";

export interface ProfileQuery {
  self?: boolean,
  id?: string[]
}

export interface IProfileRepo {
  findOne(id: string): Promise<Profile>;
  find(auth: AuthContainer, query: ProfileQuery): Promise<Profile[]>;
  insert(profile: Profile): Promise<void>;
  update(profile: Profile): Promise<void>;
}
