import {
  IRepo,
} from "../models";
import {
  Context,
  DateType,
} from "../server";

export const msgResolver = (repo: IRepo) => {
  return {
    Query: {
      msgs: async (
        _obj: any,
        args: {
          id?: string[],
          date?: DateType,
          limit: number,
        },
        context: Context,
        _info: any) => {
        const msgs = await repo.msg.find(context.auth.token, {
          id: args.id,
          date: args.date,
        }, args.limit);
        return msgs.map(x => x.toAPI(context.auth.token));
      },
    },
  };
};
