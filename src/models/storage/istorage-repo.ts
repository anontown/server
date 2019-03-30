import { IAuthToken } from "../../auth";
import * as G from "../../generated/graphql";
import { Storage } from "./storage";

export interface IStorageRepo {
  findOneKey(token: IAuthToken, key: string): Promise<Storage>;
  find(token: IAuthToken, query: G.StorageQuery): Promise<Storage[]>;
  save(storage: Storage): Promise<void>;
  del(storage: Storage): Promise<void>;
}
