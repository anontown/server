import * as G from "../generated/graphql";

export const topic: G.TopicResolvers = {
  __resolveType(obj) {
    switch (obj.type) {
      case "normal":
        return "TopicNormal";
      case "one":
        return "TopicOne";
      case "fork":
        return "TopicFork";
    }
  },
};

export const topicSearch: G.TopicSearchResolvers = {
  __resolveType(obj) {
    switch (obj.type) {
      case "normal":
        return "TopicNormal";
      case "one":
        return "TopicOne";
    }
  },
};

export const topicFork: G.TopicForkResolvers = {
  parent: async (
    token,
    _args,
    context,
    _info) => {
    const parent = await context.loader.topic.load(token.parentID);
    if (parent.type !== "normal") {
      throw new Error();
    }
    return parent.toAPI();
  },
};