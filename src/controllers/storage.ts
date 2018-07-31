import { Storage } from "../index";
import {
  Context,
} from "../server";
import { IRepo } from "../models/irepo";

export const storageResolver = (repo: IRepo) => {
  return {
    Query: {
      storages: async (_obj: any,
        args: {
          key: string[] | null
        }, context: Context,
        _info: any) => {
        const storages = await repo.storage.find(context.auth.token, { key: args.key });
        return storages.map(x => x.toAPI(context.auth.token));
      },
    },
    Mutation: {
      setStorage: async (_obj: any,
        args: {
          key: string,
          value: string
        }, context: Context,
        _info: any) => {
        const storage = Storage.create(context.auth.token, args.key, args.value);
        await repo.storage.save(storage);
        return null;
      },
      delStorage: async (_obj: any,
        args: {
          key: string,
        }, context: Context,
        _info: any) => {
        const storage = await repo.storage.findOneKey(context.auth.token, args.key);
        return storage.toAPI(context.auth.token);
      },
    },
  };
};
