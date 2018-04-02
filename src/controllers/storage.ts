import {
  controller,
  http,
  IHttpAPICallParams,
} from "../server";
import { Storage } from "../index";

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
