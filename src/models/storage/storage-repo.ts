import { isNullish } from "@kgtkr/utils";
import { ObjectID } from "mongodb";
import { AtNotFoundError } from "../../at-error";
import { IAuthToken } from "../../auth";
import { DB } from "../../db";
import * as G from "../../generated/graphql";
import { IStorageRepo } from "./istorage-repo";
import { IStorageDB, Storage } from "./storage";

export class StorageRepo implements IStorageRepo {
  async find(token: IAuthToken, query: G.StorageQuery): Promise<Storage[]> {
    const db = await DB();
    const q: any = {
      user: new ObjectID(token.user),
      client: token.type === "general" ? new ObjectID(token.client) : null,
    };
    if (!isNullish(query.key)) {
      q.key = { $in: query.key };
    }
    const storages: IStorageDB[] = await db.collection("storages")
      .find(q)
      .toArray();
    return storages.map(x => Storage.fromDB(x));
  }

  async findOneKey(token: IAuthToken, key: string): Promise<Storage> {
    const db = await DB();
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
    const db = await DB();

    await db.collection("storages")
      .replaceOne({
        user: new ObjectID(storage.user),
        client: storage.client.map(client => new ObjectID(client)).toNullable(),
        key: storage.key,
      }, storage.toDB(), { upsert: true });
  }
  async del(storage: Storage): Promise<void> {
    const db = await DB();

    await db.collection("storages")
      .deleteOne({
        user: new ObjectID(storage.user),
        client: storage.client.map(client => new ObjectID(client)).toNullable(),
        key: storage.key,
      });
  }
}
