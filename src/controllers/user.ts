import { ObjectIDGenerator } from "../generator";
import {
  IRepo,
  User,
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
        _info: any) => {
        return await repo.user.findID(args.sn);
      },
      userSN: async (
        _obj: any,
        args: {
          id: string,
        },
        _context: Context,
        _info: any) => {
        return (await repo.user.findOne(args.id)).sn;
      },
      user: async (
        _obj: any,
        _args: {},
        context: Context,
        _info: any) => {
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
        _info: any) => {
        await authFromApiParam.recaptcha(args.recaptcha);
        const user = User.create(ObjectIDGenerator, args.sn, args.pass, context.now);
        await repo.user.insert(user);
        return user.toAPI();
      },
      updateUser: async (
        _obj: any,
        args: {
          sn?: string,
          pass?: string,
          auth: {
            id: string,
            pass: string,
          },
        },
        _context: Context,
        _info: any) => {
        const authUser = await authFromApiParam.user(repo.user, args.auth);
        const user = await repo.user.findOne(authUser.id);
        const newUser = user.change(authUser, args.pass, args.sn);
        await repo.user.update(newUser);
        await repo.token.delMasterToken(authUser);
        return newUser.toAPI();
      },
    },
  };
};
