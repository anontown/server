import { AtNotFoundError } from "../../at-error";
import { IAuthToken } from "../../auth";
import { IStorageRepo } from "./istorage-repo";
import { IStorageDB, Storage } from "./storage";

export class StorageRepoMock implements IStorageRepo {
  private storages: IStorageDB[] = [];

  async findOneKey(token: IAuthToken, key: string): Promise<Storage> {
    const storage = this.storages.find(x => x.user.toHexString() === token.user
      && (x.client !== null ? x.client.toHexString() : null) === (token.type === "general" ? token.client : null)
      && x.key === key);

    if (storage === undefined) {
      throw new AtNotFoundError("ストレージが見つかりません");
    }
    return Storage.fromDB(storage);
  }
  async save(storage: Storage): Promise<void> {
    const index = this.storages.findIndex(x => x.user.toHexString() === storage.user
      && (x.client !== null ? x.client.toHexString() : null) === storage.client
      && x.key === storage.key);
    if (index === -1) {
      this.storages.push(storage.toDB());
    } else {
      this.storages[index] = storage.toDB();
    }
  }
  async del(storage: Storage): Promise<void> {
    const index = this.storages.findIndex(x => x.user.toHexString() === storage.user
      && (x.client !== null ? x.client.toHexString() : null) === storage.client
      && x.key === storage.key);
    this.storages.splice(index, 1);
  }
  async list(token: IAuthToken): Promise<string[]> {
    return this.storages
      .filter(x => x.user.toHexString() === token.user
        && (x.client !== null ? x.client.toHexString() : null) === (token.type === "general" ? token.client : null))
      .map(x => x.key);
  }
}
