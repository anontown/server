import {
  IHistoryAPI, IRepo, ITopicNormalAPI,
} from "../models";
import {
  AppContext,
} from "../server";
import * as G from "../generated/graphql";

export const historyResolver = {
  Query: {
    histories: async (
      _obj: any,
      args: G.QueryHistoriesArgs,
      context: AppContext,
      _info: any): Promise<IHistoryAPI[]> => {
      const histories = await context.repo.history.find(args.query, args.limit);
      return histories.map(x => x.toAPI(context.auth.tokenOrNull));
    },
  },
  History: {
    topic: async (
      history: IHistoryAPI,
      _args: {},
      context: AppContext,
      _info: any): Promise<ITopicNormalAPI> => {
      const topic = await context.loader.topic.load(history.topicID);
      if (topic.type !== "normal") {
        throw new Error();
      }
      return topic.toAPI();
    },
  },
};