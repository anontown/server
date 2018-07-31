import { ObjectIDGenerator } from "../generator";
import {
  IRepo,
  User,
} from "../models";
import {
  Context,
} from "../server";

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
    },
    Mutation: {
      createUser: async (
        _obj: any,
        args: {
          sn: string,
          pass: string,
        },
        context: Context,
        _info: any) => {
        const user = User.create(ObjectIDGenerator, args.sn, args.pass, context.now);
        await repo.user.insert(user);
        return user.toAPI();
      },
      updateUser: async (
        _obj: any,
        args: {
          sn: string,
          pass: string,
        },
        context: Context,
        _info: any) => {
        const user = await repo.user.findOne(context.auth.user.id);
        const newUser = user.change(context.auth.user, args.pass, args.sn);
        await repo.user.update(newUser);
        await repo.token.delMasterToken(context.auth.user);
        return newUser.toAPI();
      },
    },
  };
};
