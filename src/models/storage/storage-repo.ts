import { ObjectID } from "mongodb";
import { AtNotFoundError } from "../../at-error";
import { IAuthToken } from "../../auth";
import { DB } from "../../db";
import { IStorageRepo } from "./istorage-repo";
import { IStorageDB, Storage } from "./storage";

export class StorageRepo implements IStorageRepo {
  async findOneKey(token: IAuthToken, key: string): Promise<Storage> {
    const db = await DB;
    const storage: IStorageDB | null = await db.collection("storages")
      .findOne({
        user: new ObjectID(token.user),
        client: token.type === "general" ? new ObjectID(token.client) : null,
        key,
      });
    if (storage === null) {
      throw new AtNotFoundError("ストレージが見つかりません");
    }
    return Storage.fromDB(storage);
  }
  async save(storage: Storage): Promise<void> {
    const db = await DB;

    await db.collection("storages")
      .update({
        user: new ObjectID(storage.user),
        client: storage.client !== null ? new ObjectID(storage.client) : null,
        key: storage.key,
      }, storage.toDB(), { upsert: true });
  }
  async del(storage: Storage): Promise<void> {
    const db = await DB;

    await db.collection("storages")
      .deleteOne({
        user: new ObjectID(storage.user),
        client: storage.client !== null ? new ObjectID(storage.client) : null,
        key: storage.key,
      });
  }
  async list(token: IAuthToken): Promise<string[]> {
    const db = await DB;
    const ls: IStorageDB[] = await db.collection("storages")
      .find({
        user: new ObjectID(token.user),
        client: token.type === "general" ? new ObjectID(token.client) : null,
      })
      .toArray();
    return ls.map(s => s.key);
  }
}
