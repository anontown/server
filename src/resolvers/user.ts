import { ObjectIDGenerator, RandomGenerator } from "../generator";
import {
  IRepo,
  IUserAPI,
  User,
  TokenMaster,
  ITokenMasterAPI,
} from "../models";
import {
  AppContext,
} from "../server";
import * as authFromApiParam from "../server/auth-from-api-param";

export const userResolver = {
  Query: {
    userID: async (
      _obj: any,
      args: {
        sn: string,
      },
      context: AppContext,
      _info: any): Promise<string> => {
      return await context.repo.user.findID(args.sn);
    },
    userSN: async (
      _obj: any,
      args: {
        id: string,
      },
      context: AppContext,
      _info: any): Promise<string> => {
      return (await context.repo.user.findOne(args.id)).sn;
    },
    user: async (
      _obj: any,
      _args: {},
      context: AppContext,
      _info: any): Promise<IUserAPI> => {
      return (await context.repo.user.findOne(context.auth.token.user)).toAPI();
    },
  },
  Mutation: {
    createUser: async (
      _obj: any,
      args: {
        sn: string,
        pass: string,
        recaptcha: string,
      },
      context: AppContext,
      _info: any): Promise<{ user: IUserAPI, token: ITokenMasterAPI }> => {
      await authFromApiParam.recaptcha(args.recaptcha);

      const user = User.create(ObjectIDGenerator, args.sn, args.pass, context.now);
      await context.repo.user.insert(user);

      const token = TokenMaster.create(ObjectIDGenerator, user.auth(args.pass), context.now, RandomGenerator);
      await context.repo.token.insert(token);

      return { user: user.toAPI(), token: token.toAPI() };
    },
    updateUser: async (
      _obj: any,
      args: {
        sn?: string,
        pass?: string,
        auth: {
          id?: string,
          sn?: string,
          pass: string,
        },
      },
      context: AppContext,
      _info: any): Promise<{ user: IUserAPI, token: ITokenMasterAPI }> => {
      const authUser = await authFromApiParam.user(context.repo.user, args.auth);
      const user = await context.repo.user.findOne(authUser.id);
      const newUser = user.change(authUser, args.pass, args.sn);
      await context.repo.user.update(newUser);
      await context.repo.token.delMasterToken(authUser);

      const token = TokenMaster.create(ObjectIDGenerator, authUser, context.now, RandomGenerator);
      await context.repo.token.insert(token);
      return { user: newUser.toAPI(), token: token.toAPI() };
    },
  },
};