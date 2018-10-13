import { AtNotFoundError } from "../at-error";
import { ObjectIDGenerator, RandomGenerator } from "../generator";
import {
  IClientAPI,
  IRepo,
  ITokenAPI,
  ITokenGeneralAPI,
  ITokenMasterAPI,
  ITokenReqAPI,
  TokenGeneral,
  TokenMaster,
} from "../models";
import {
  Context,
} from "../server";
import * as authFromApiParam from "../server/auth-from-api-param";

export const tokenResolver = (repo: IRepo) => {
  return {
    Query: {
      token: async (
        _obj: any,
        _args: {}, context: Context,
        _info: any): Promise<ITokenAPI> => {
        const token = await repo.token.findOne(context.auth.token.id);
        return token.toAPI();
      },
      tokens: async (
        _obj: any,
        _args: {}, context: Context,
        _info: any): Promise<ITokenAPI[]> => {
        const tokens = await repo.token.findAll(context.auth.tokenMaster);
        return tokens.map(t => t.toAPI());
      },
    },
    Mutation: {
      delTokenClient: async (
        _obj: any,
        args: {
          client: string,
        },
        context: Context,
        _info: any): Promise<boolean | null> => {
        const client = await repo.client.findOne(args.client);
        await repo.token.delClientToken(context.auth.tokenMaster, client.id);
        return null;
      },
      createTokenGeneral: async (
        _obj: any,
        args: {
          client: string,
        },
        context: Context,
        _info: any): Promise<ITokenGeneralAPI> => {
        const client = await repo.client.findOne(args.client);
        const token = TokenGeneral.create(ObjectIDGenerator,
          context.auth.tokenMaster,
          client,
          context.now,
          RandomGenerator);
        await repo.token.insert(token);

        return token.toAPI();
      },
      createTokenMaster: async (
        _obj: any,
        args: {
          auth: { id: string, pass: string },
        },
        context: Context,
        _info: any): Promise<ITokenMasterAPI> => {
        const authUser = await authFromApiParam.user(repo.user, args.auth);
        const token = TokenMaster.create(ObjectIDGenerator, authUser, context.now, RandomGenerator);
        await repo.token.insert(token);

        return token.toAPI();
      },
      authTokenReq: async (
        _obj: any,
        args: {
          id: string,
          key: string,
        },
        context: Context,
        _info: any): Promise<ITokenGeneralAPI> => {
        const token = await repo.token.findOne(args.id);
        if (token.type !== "general") {
          throw new AtNotFoundError("トークンが見つかりません");
        }
        token.authReq(args.key, context.now);
        return token.toAPI();
      },
    },
    Token: {
      __resolveType(obj: ITokenAPI): "TokenGeneral" | "TokenMaster" {
        switch (obj.type) {
          case "general":
            return "TokenGeneral";
          case "master":
            return "TokenMaster";
        }
      },
    },
    TokenGeneral: {
      client: async (
        token: ITokenGeneralAPI,
        _args: {},
        context: Context,
        _info: any): Promise<IClientAPI> => {
        const client = await context.loader.client.load(token.clientID);
        return client.toAPI(context.auth.TokenMasterOrNull);
      },
      createReq: async (
        tokenAPI: ITokenGeneralAPI,
        _args: {}, context: Context,
        _info: any): Promise<ITokenReqAPI> => {
        const token = await repo.token.findOne(tokenAPI.id);
        if (token.type !== "general") {
          throw new AtNotFoundError("トークンが見つかりません");
        }
        const { req, token: newToken } = token.createReq(context.now, RandomGenerator);

        await repo.token.update(newToken);

        return req;
      },
    },
  };
};
