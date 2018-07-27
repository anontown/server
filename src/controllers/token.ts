import { AtPrerequisiteError } from "../at-error";
import { ObjectIDGenerator, RandomGenerator } from "../generator";
import {
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
  Context,
} from "../server";

export const tokenResolver = {
  Query: {
    token: async (_obj: any,
      _args: {}, context: Context,
      _info: any) => {
      const token = await context.repo.token.findOne(context.auth.token.id);
      return token.toAPI();
    },
    tokens: async (_obj: any,
      _args: {}, context: Context,
      _info: any) => {
      const tokens = await context.repo.token.findAll(context.auth.tokenMaster);
      return tokens.map(t => t.toAPI());
    },
  },
  Mutation: {
    delTokenClient: async (_obj: any,
      args: {
        client: string
      }, context: Context,
      _info: any) => {
      const client = await context.repo.client.findOne(args.client);
      await context.repo.token.delClientToken(context.auth.tokenMaster, client.id);
      return null;
    },
    createTokenGeneral: async (_obj: any,
      args: {
        client: string
      }, context: Context,
      _info: any) => {
      const client = await context.repo.client.findOne(args.client);
      const token = TokenGeneral.create(ObjectIDGenerator, context.auth.tokenMaster, client, context.now, RandomGenerator);
      await context.repo.token.insert(token);

      return token.toAPI();
    },
    createTokenMaster: async (_obj: any,
      _args: {}, context: Context,
      _info: any) => {
      const token = TokenMaster.create(ObjectIDGenerator, context.auth.user, context.now, RandomGenerator);
      await context.repo.token.insert(token);

      return token.toAPI();
    },
    createTokenReq: async (_obj: any,
      _args: {}, context: Context,
      _info: any) => {
      const token = await context.repo.token.findOne(context.auth.token.id);
      if (token.type !== "general") {
        throw new AtPrerequisiteError("通常トークン以外では出来ません");
      }
      const { req, token: newToken } = token.createReq(context.now, RandomGenerator);

      await context.repo.token.update(newToken);

      return req;
    },
    authTokenReq: async (_obj: any,
      args: {
        id: string,
        key: string
      }, context: Context,
      _info: any) => {
      const token = await context.repo.token.findOne(args.id);
      if (token.type !== "general") {
        throw new AtPrerequisiteError("通常トークン以外では出来ません");
      }
      token.authReq(args.key, context.now);
      return token.toAPI();
    },
  },
};

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
    await repo.token.delClientToken(auth.tokenMaster, client.id);
    return null;
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
