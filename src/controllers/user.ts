import { ObjectIDGenerator, RandomGenerator } from "../generator";
import {
  IRepo,
  IUserAPI,
  User,
  TokenMaster,
  ITokenMasterAPI,
} from "../models";
import {
  Context,
} from "../server";
import * as authFromApiParam from "../server/auth-from-api-param";

export const userResolver = (repo: IRepo) => {
  return {
    Query: {
      userID: async (
        _obj: any,
        args: {
          sn: string,
        },
        _context: Context,
        _info: any): Promise<string> => {
        return await repo.user.findID(args.sn);
      },
      userSN: async (
        _obj: any,
        args: {
          id: string,
        },
        _context: Context,
        _info: any): Promise<string> => {
        return (await repo.user.findOne(args.id)).sn;
      },
      user: async (
        _obj: any,
        _args: {},
        context: Context,
        _info: any): Promise<IUserAPI> => {
        return (await repo.user.findOne(context.auth.token.user)).toAPI();
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
        context: Context,
        _info: any): Promise<{ user: IUserAPI, token: ITokenMasterAPI }> => {
        await authFromApiParam.recaptcha(args.recaptcha);

        const user = User.create(ObjectIDGenerator, args.sn, args.pass, context.now);
        await repo.user.insert(user);

        const token = TokenMaster.create(ObjectIDGenerator, user.auth(args.pass), context.now, RandomGenerator);
        await repo.token.insert(token);

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
        context: Context,
        _info: any): Promise<{ user: IUserAPI, token: ITokenMasterAPI }> => {
        const authUser = await authFromApiParam.user(repo.user, args.auth);
        const user = await repo.user.findOne(authUser.id);
        const newUser = user.change(authUser, args.pass, args.sn);
        await repo.user.update(newUser);
        await repo.token.delMasterToken(authUser);

        const token = TokenMaster.create(ObjectIDGenerator, authUser, context.now, RandomGenerator);
        await repo.token.insert(token);
        return { user: newUser.toAPI(), token: token.toAPI() };
      },
    },
  };
};
