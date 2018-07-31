import { AtPrerequisiteError } from "../at-error";
import { ObjectIDGenerator, RandomGenerator } from "../generator";
import {
  IRepo,
  ITokenAPI,
  TokenGeneral,
  TokenMaster,
} from "../models";
import {
  Context,
} from "../server";

export const tokenResolver = (repo: IRepo) => {
  return {
    Query: {
      token: async (
        _obj: any,
        _args: {}, context: Context,
        _info: any) => {
        const token = await repo.token.findOne(context.auth.token.id);
        return token.toAPI();
      },
      tokens: async (
        _obj: any,
        _args: {}, context: Context,
        _info: any) => {
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
        _info: any) => {
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
        _info: any) => {
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
        _args: {}, context: Context,
        _info: any) => {
        const token = TokenMaster.create(ObjectIDGenerator, context.auth.user, context.now, RandomGenerator);
        await repo.token.insert(token);

        return token.toAPI();
      },
      createTokenReq: async (
        _obj: any,
        _args: {}, context: Context,
        _info: any) => {
        const token = await repo.token.findOne(context.auth.token.id);
        if (token.type !== "general") {
          throw new AtPrerequisiteError("通常トークン以外では出来ません");
        }
        const { req, token: newToken } = token.createReq(context.now, RandomGenerator);

        await repo.token.update(newToken);

        return req;
      },
      authTokenReq: async (
        _obj: any,
        args: {
          id: string,
          key: string,
        },
        context: Context,
        _info: any) => {
        const token = await repo.token.findOne(args.id);
        if (token.type !== "general") {
          throw new AtPrerequisiteError("通常トークン以外では出来ません");
        }
        token.authReq(args.key, context.now);
        return token.toAPI();
      },
    },
    Token: {
      __resolveType(obj: ITokenAPI) {
        switch (obj.type) {
          case "general":
            return "TokenGeneral";
          case "master":
            return "TokenMaster";
        }
      },
    },
  };
};
