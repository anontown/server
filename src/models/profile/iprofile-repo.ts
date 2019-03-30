import * as G from "../../generated/graphql";
import { AuthContainer } from "../../server/auth-container";
import { Profile } from "./profile";

export interface IProfileRepo {
  findOne(id: string): Promise<Profile>;
  find(auth: AuthContainer, query: G.ProfileQuery): Promise<Profile[]>;
  insert(profile: Profile): Promise<void>;
  update(profile: Profile): Promise<void>;
}
