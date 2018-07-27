import { Storage } from "../index";
import {
  controller,
  http,
  IHttpAPICallParams,
  Context,
} from "../server";

export const storageResolver = {
  Query: {
    storages: async (_obj: any,
      args: {
        key: string[] | null
      }, context: Context,
      _info: any) => {
      const storages = await context.repo.storage.find(context.auth.token, { key: args.key });
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
      await context.repo.storage.save(storage);
      return null;
    },
    delStorage: async (_obj: any,
      args: {
        key: string,
      }, context: Context,
      _info: any) => {
      const storage = await context.repo.storage.findOneKey(context.auth.token, args.key);
      return storage.toAPI(context.auth.token);
    },
  },
};

@controller
export class StorageController {
  @http({
    url: "/storage/set",

    isAuthUser: false,
    isAuthToken: "all",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["key", "value"],
      properties: {
        key: {
          type: "string",
        },
        value: {
          type: "string",
        },
      },
    },
  })
  async setStorage({ params, auth, repo }: IHttpAPICallParams<{ key: string, value: string }>): Promise<null> {
    const storage = Storage.create(auth.token, params.key, params.value);
    await repo.storage.save(storage);
    return null;
  }

  @http({
    url: "/storage/get",

    isAuthUser: false,
    isAuthToken: "all",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["key"],
      properties: {
        key: {
          type: "string",
        },
      },
    },
  })
  async getStorage({ params, auth, repo }: IHttpAPICallParams<{ key: string }>): Promise<string> {
    const storage = await repo.storage.findOneKey(auth.token, params.key);
    return storage.toAPI(auth.token);
  }

  @http({
    url: "/storage/delete",

    isAuthUser: false,
    isAuthToken: "all",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["key"],
      properties: {
        key: {
          type: "string",
        },
      },
    },
  })
  async deleteStorage({ params, auth, repo }: IHttpAPICallParams<{ key: string }>): Promise<null> {
    const storage = await repo.storage.findOneKey(auth.token, params.key);
    await repo.storage.del(storage);
    return null;
  }

  @http({
    url: "/storage/list",

    isAuthUser: false,
    isAuthToken: "all",
    schema: {
      type: "null",
    },
  })
  async listStorage({ auth, repo }: IHttpAPICallParams<null>): Promise<string[]> {
    return await repo.storage.list(auth.token);
  }
}
