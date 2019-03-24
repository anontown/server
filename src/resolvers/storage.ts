import { Storage } from "../index";
import { IStorageAPI } from "../models/index";
import { IRepo } from "../models/irepo";
import {
  AppContext,
} from "../server";
import * as G from "../generated/graphql";

export const storageResolver = {
  Query: {
    storages: async (
      _obj: any,
      args: G.QueryStoragesArgs,
      context: AppContext,
      _info: any): Promise<IStorageAPI[]> => {
      const storages = await context.repo.storage.find(context.auth.token, args.query);
      return storages.map(x => x.toAPI(context.auth.token));
    },
  },
  Mutation: {
    setStorage: async (
      _obj: any,
      args: G.MutationSetStorageArgs,
      context: AppContext,
      _info: any): Promise<IStorageAPI> => {
      const storage = Storage.create(context.auth.token, args.key, args.value);
      await context.repo.storage.save(storage);
      return storage.toAPI(context.auth.token);
    },
    delStorage: async (
      _obj: any,
      args: G.MutationDelStorageArgs,
      context: AppContext,
      _info: any): Promise<boolean | null> => {
      const storage = await context.repo.storage.findOneKey(context.auth.token, args.key);
      await context.repo.storage.del(storage);
      return null;
    },
  },
};
