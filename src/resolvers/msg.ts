import {
  IMsgAPI,
} from "../models";
import {
  AppContext,
} from "../server";
import * as G from "../generated/graphql";

export const msgResolver = {
  Query: {
    msgs: async (
      _obj: any,
      args: G.QueryMsgsArgs,
      context: AppContext,
      _info: any): Promise<IMsgAPI[]> => {
      const msgs = await context.repo.msg.find(context.auth.token, args.query, args.limit);
      return msgs.map(x => x.toAPI(context.auth.token));
    },
  },
};