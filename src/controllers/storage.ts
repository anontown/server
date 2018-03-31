import {
  controller,
  http,
  IHttpAPICallParams,
} from "../server";

@controller
export class StorageController {
  @http({
    url: "/token/storage/set",

    isAuthUser: false,
    isAuthToken: "all",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["name", "value"],
      properties: {
        name: {
          type: "string",
        },
        value: {
          type: "string",
        },
      },
    },
  })
  async setStorage({ params, auth, repo }: IHttpAPICallParams<{ name: string, value: string }>): Promise<null> {
    const storage = await repo.storage.findOneKey(auth.token, params.name);
    storage.changeData(auth.token, params.value);
    await repo.storage.save(storage);
    return null;
  }

  @http({
    url: "/token/storage/get",

    isAuthUser: false,
    isAuthToken: "all",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["name"],
      properties: {
        name: {
          type: "string",
        },
      },
    },
  })
  async getStorage({ params, auth, repo }: IHttpAPICallParams<{ name: string }>): Promise<string> {
    const storage = await repo.storage.findOneKey(auth.token, params.name);
    return storage.toAPI(auth.token);
  }

  @http({
    url: "/token/storage/delete",

    isAuthUser: false,
    isAuthToken: "all",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["name"],
      properties: {
        name: {
          type: "string",
        },
      },
    },
  })
  async deleteStorage({ params, auth, repo }: IHttpAPICallParams<{ name: string }>): Promise<null> {
    const storage = await repo.storage.findOneKey(auth.token, params.name);
    await repo.storage.del(storage);
    return null;
  }

  @http({
    url: "/token/storage/list",

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
