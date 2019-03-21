import { Storage, StorageQuery } from "../index";
import { IStorageAPI } from "../models/index";
import { IRepo } from "../models/irepo";
import {
  AppContext,
} from "../server";

export const storageResolver = (repo: IRepo) => {
  return {
    Query: {
      storages: async (
        _obj: any,
        args: {
          query: StorageQuery,
        },
        context: AppContext,
        _info: any): Promise<IStorageAPI[]> => {
        const storages = await repo.storage.find(context.auth.token, args.query);
        return storages.map(x => x.toAPI(context.auth.token));
      },
    },
    Mutation: {
      setStorage: async (
        _obj: any,
        args: {
          key: string,
          value: string,
        },
        context: AppContext,
        _info: any): Promise<IStorageAPI> => {
        const storage = Storage.create(context.auth.token, args.key, args.value);
        await repo.storage.save(storage);
        return storage.toAPI(context.auth.token);
      },
      delStorage: async (
        _obj: any,
        args: {
          key: string,
        },
        context: AppContext,
        _info: any): Promise<boolean | null> => {
        const storage = await repo.storage.findOneKey(context.auth.token, args.key);
        await repo.storage.del(storage);
        return null;
      },
    },
  };
};
