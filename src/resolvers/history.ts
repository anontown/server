import * as G from "../generated/graphql";

export const history: G.HistoryResolvers = {
  topic: async (
    history,
    _args,
    context,
    _info) => {
    const topic = await context.loader.topic.load(history.topicID);
    if (topic.type !== "normal") {
      throw new Error();
    }
    return topic.toAPI();
  },
};