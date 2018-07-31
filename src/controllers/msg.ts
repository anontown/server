import {
  IRepo, MsgQuery,
} from "../models";
import {
  Context,
} from "../server";

export const msgResolver = (repo: IRepo) => {
  return {
    Query: {
      msgs: async (
        _obj: any,
        args: {
          query: MsgQuery
          limit: number,
        },
        context: Context,
        _info: any) => {
        const msgs = await repo.msg.find(context.auth.token, args.query, args.limit);
        return msgs.map(x => x.toAPI(context.auth.token));
      },
    },
  };
};
