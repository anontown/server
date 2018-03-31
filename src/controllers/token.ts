import { AtPrerequisiteError } from "../at-error";
import { ObjectIDGenerator, RandomGenerator } from "../generator";
import {
  IClientAPI,
  ITokenAPI,
  ITokenGeneralAPI,
  ITokenMasterAPI,
  ITokenReqAPI,
  TokenGeneral,
  TokenMaster,
} from "../models";
import {
  controller,
  http,
  IHttpAPICallParams,
} from "../server";

@controller
export class TokenController {
  @http({
    url: "/token/find/one",

    isAuthUser: false,
    isAuthToken: "all",
    schema: {
      type: "null",
    },
  })
  async findOne({ auth, repo }: IHttpAPICallParams<null>): Promise<ITokenAPI> {
    const token = await repo.token.findOne(auth.token.id);
    return token.toAPI();
  }

  @http({
    url: "/token/find/all",

    isAuthUser: false,
    isAuthToken: "master",
    schema: {
      type: "null",
    },
  })
  async findAll({ auth, repo }: IHttpAPICallParams<null>): Promise<ITokenAPI[]> {
    const tokens = await repo.token.findAll(auth.tokenMaster);
    return tokens.map(t => t.toAPI());
  }

  @http({
    url: "/token/client/delete",

    isAuthUser: false,
    isAuthToken: "master",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["client"],
      properties: {
        client: {
          type: "string",
        },
      },
    },
  })
  async deleteClient({ params, auth, repo }: IHttpAPICallParams<{ client: string }>): Promise<null> {
    const client = await repo.client.findOne(params.client);
    await repo.token.delClientToken(auth.tokenMaster, client);
    return null;
  }

  @http({
    url: "/token/find/client/all",

    isAuthUser: false,
    isAuthToken: "master",
    schema: {
      type: "null",
    },
  })
  async findClientAll({ auth, repo }: IHttpAPICallParams<null>): Promise<IClientAPI[]> {
    const clients = await repo.token.listClient(auth.tokenMaster);
    return clients.map(c => c.toAPI(auth.tokenMaster));
  }

  @http({
    url: "/token/create/general",

    isAuthUser: false,
    isAuthToken: "master",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["client"],
      properties: {
        client: {
          type: "string",
        },
      },
    },
  })
  async createGeneral({ params, auth, now, repo }: IHttpAPICallParams<{ client: string }>): Promise<ITokenGeneralAPI> {
    const client = await repo.client.findOne(params.client);
    const token = TokenGeneral.create(ObjectIDGenerator, auth.tokenMaster, client, now, RandomGenerator);
    await repo.token.insert(token);

    return token.toAPI();
  }

  @http({
    url: "/token/create/master",

    isAuthUser: true,
    isAuthToken: "no",
    schema: {
      type: "null",
    },
  })
  async createMaster({ auth, now, repo }: IHttpAPICallParams<null>): Promise<ITokenMasterAPI> {
    const token = TokenMaster.create(ObjectIDGenerator, auth.user, now, RandomGenerator);
    await repo.token.insert(token);

    return token.toAPI();
  }

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

  @http({
    url: "/token/req/create",

    isAuthUser: false,
    isAuthToken: "all",
    schema: {
      type: "null",
    },
  })
  async createReq({ auth, now, repo }: IHttpAPICallParams<null>): Promise<ITokenReqAPI> {
    const token = await repo.token.findOne(auth.token.id);
    if (token.type !== "general") {
      throw new AtPrerequisiteError("通常トークン以外では出来ません");
    }
    const { req, token: newToken } = token.createReq(now, RandomGenerator);

    await repo.token.update(newToken);

    return req;
  }

  @http({
    url: "/token/find/req",

    isAuthUser: false,
    isAuthToken: "no",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["id", "key"],
      properties: {
        id: {
          type: "string",
        },
        key: {
          type: "string",
        },
      },
    },
  })
  async findReq({ params, now, repo }: IHttpAPICallParams<{ id: string, key: string }>): Promise<ITokenGeneralAPI> {
    const token = await repo.token.findOne(params.id);
    if (token.type !== "general") {
      throw new AtPrerequisiteError("通常トークン以外では出来ません");
    }
    token.authReq(params.key, now);
    return token.toAPI();
  }
}
