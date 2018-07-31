import {
  HistoryQuery, IRepo,
} from "../models";
import {
  Context,
} from "../server";

export const historyResolver = (repo: IRepo) => {
  return {
    Query: {
      histories: async (
        _obj: any,
        args: {
          query: HistoryQuery,
        },
        _context: Context,
        _info: any) => {
        const histories = await repo.history.find(args.query);
        return histories.map(x => x.toAPI());
      },
    },
  };
};
