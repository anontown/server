import { IAuthToken } from "../../auth";
import { Storage } from "./storage";

export interface StorageQuery {
  key?: string[];
}

export interface IStorageRepo {
  findOneKey(token: IAuthToken, key: string): Promise<Storage>;
  find(token: IAuthToken, query: StorageQuery): Promise<Storage[]>;
  save(storage: Storage): Promise<void>;
  del(storage: Storage): Promise<void>;
  list(token: IAuthToken): Promise<string[]>;
}
