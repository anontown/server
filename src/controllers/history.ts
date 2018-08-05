import {
  HistoryQuery, IHistoryAPI, IRepo,
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
          limit: number,
        },
        _context: Context,
        _info: any) => {
        const histories = await repo.history.find(args.query, args.limit);
        return histories.map(x => x.toAPI());
      },
    },
    History: {
      topic: async (
        history: IHistoryAPI,
        _args: {},
        context: Context,
        _info: any) => {
        const topic = await context.loader.topic.load(history.topicID);
        return topic.toAPI();
      },
    },
  };
};
