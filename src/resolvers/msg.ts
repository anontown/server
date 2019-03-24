import {
  IMsgAPI, IRepo, MsgQuery,
} from "../models";
import {
  AppContext,
} from "../server";

export const msgResolver = {
  Query: {
    msgs: async (
      _obj: any,
      args: {
        query: MsgQuery
        limit: number,
      },
      context: AppContext,
      _info: any): Promise<IMsgAPI[]> => {
      const msgs = await context.repo.msg.find(context.auth.token, args.query, args.limit);
      return msgs.map(x => x.toAPI(context.auth.token));
    },
  },
};