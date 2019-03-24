import { IAuthToken } from "../../auth";
import { Storage } from "./storage";
import * as G from "../../generated/graphql";

export interface IStorageRepo {
  findOneKey(token: IAuthToken, key: string): Promise<Storage>;
  find(token: IAuthToken, query: G.StorageQuery): Promise<Storage[]>;
  save(storage: Storage): Promise<void>;
  del(storage: Storage): Promise<void>;
}
