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
  AppContext,
} from "../server";
import * as authFromApiParam from "../server/auth-from-api-param";

export const tokenResolver = {
  Query: {
    token: async (
      _obj: any,
      _args: {}, context: AppContext,
      _info: any): Promise<ITokenAPI> => {
      const token = await context.repo.token.findOne(context.auth.token.id);
      return token.toAPI();
    },
    tokens: async (
      _obj: any,
      _args: {}, context: AppContext,
      _info: any): Promise<ITokenAPI[]> => {
      const tokens = await context.repo.token.findAll(context.auth.tokenMaster);
      return tokens.map(t => t.toAPI());
    },
  },
  Mutation: {
    delTokenClient: async (
      _obj: any,
      args: {
        client: string,
      },
      context: AppContext,
      _info: any): Promise<boolean | null> => {
      const client = await context.repo.client.findOne(args.client);
      await context.repo.token.delClientToken(context.auth.tokenMaster, client.id);
      return null;
    },
    createTokenGeneral: async (
      _obj: any,
      args: {
        client: string,
      },
      context: AppContext,
      _info: any): Promise<{ token: ITokenGeneralAPI, req: ITokenReqAPI }> => {
      const client = await context.repo.client.findOne(args.client);
      const token = TokenGeneral.create(ObjectIDGenerator,
        context.auth.tokenMaster,
        client,
        context.now,
        RandomGenerator);

      const { req, token: newToken } = token.createReq(context.now, RandomGenerator);

      await context.repo.token.insert(newToken);

      return {
        token: token.toAPI(),
        req
      };
    },
    createTokenMaster: async (
      _obj: any,
      args: {
        auth: {
          id?: string,
          sn?: string,
          pass: string
        },
      },
      context: AppContext,
      _info: any): Promise<ITokenMasterAPI> => {
      const authUser = await authFromApiParam.user(context.repo.user, args.auth);
      const token = TokenMaster.create(ObjectIDGenerator, authUser, context.now, RandomGenerator);
      await context.repo.token.insert(token);

      return token.toAPI();
    },
    authTokenReq: async (
      _obj: any,
      args: {
        id: string,
        key: string,
      },
      context: AppContext,
      _info: any): Promise<ITokenGeneralAPI> => {
      const token = await context.repo.token.findOne(args.id);
      if (token.type !== "general") {
        throw new AtNotFoundError("トークンが見つかりません");
      }
      token.authReq(args.key, context.now);
      return token.toAPI();
    },
    createTokenReq: async (
      _obj: any,
      _args: {},
      context: AppContext,
      _info: any): Promise<ITokenReqAPI> => {
      const token = await context.repo.token.findOne(context.auth.token.id);
      if (token.type !== "general") {
        throw new AtNotFoundError("トークンが見つかりません");
      }
      const { req, token: newToken } = token.createReq(context.now, RandomGenerator);

      await context.repo.token.update(newToken);

      return req;
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
      context: AppContext,
      _info: any): Promise<IClientAPI> => {
      const client = await context.loader.client.load(token.clientID);
      return client.toAPI(context.auth.TokenMasterOrNull);
    },
  },
};