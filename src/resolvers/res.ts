import * as G from "../generated/graphql";

const resBase: Pick<G.ResResolvers, "topic"> = {
  topic: async (
    res,
    _args,
    context,
    _info) => {
    const topic = await context.loader.topic.load(res.topicID);
    return topic.toAPI();
  },
};

export const res: G.ResResolvers = {
  __resolveType(obj) {
    switch (obj.type) {
      case "normal":
        return "ResNormal";
      case "history":
        return "ResHistory";
      case "topic":
        return "ResTopic";
      case "fork":
        return "ResFork";
      case "delete":
        return "ResDelete";
    }
  }
};

export const resNormal: G.ResNormalResolvers = {
  ...resBase,
  reply: async (
    res,
    _args,
    context,
    _info) => {
    if (res.replyID !== null) {
      const reply = await context.loader.res.load(res.replyID);
      return reply.toAPI(context.auth.tokenOrNull);
    } else {
      return null;
    }
  },
  profile: async (
    res,
    _args,
    context,
    _info) => {
    if (res.profileID !== null) {
      const profile = await context.loader.profile.load(res.profileID);
      return profile.toAPI(context.auth.tokenOrNull);
    } else {
      return null;
    }
  },
};

export const resHistory: G.ResHistoryResolvers = {
  ...resBase,
  history: async (
    res,
    _args,
    context,
    _info) => {
    const history = await context.loader.history.load(res.historyID);
    return history.toAPI(context.auth.tokenOrNull);
  },
};

export const resTopic: G.ResTopicResolvers = {
  ...resBase
};

export const resFork: G.ResForkResolvers = {
  ...resBase,
  fork: async (
    res,
    _args,
    context,
    _info) => {
    const fork = await context.loader.topic.load(res.forkID);
    if (fork.type !== "fork") {
      throw new Error();
    }
    return fork.toAPI();
  },
};

export const resDelete: G.ResDeleteResolvers = {
  ...resBase
};