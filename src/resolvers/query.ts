import * as G from "../generated/graphql";

export const query: G.QueryResolvers = {
  userID: async (
    _obj,
    args,
    context,
    _info) => {
    return await context.repo.user.findID(args.sn);
  },
  userSN: async (
    _obj,
    args,
    context,
    _info) => {
    return (await context.repo.user.findOne(args.id)).sn;
  },
  user: async (
    _obj,
    _args,
    context,
    _info) => {
    return (await context.repo.user.findOne(context.auth.token.user)).toAPI();
  },
  clients: async (
    _obj,
    args,
    context,
    _info) => {
    const clients = await context.repo.client.find(context.auth.TokenMasterOrNull, args.query);
    return clients.map(c => c.toAPI(context.auth.TokenMasterOrNull));
  },
  histories: async (
    _obj,
    args,
    context,
    _info) => {
    const histories = await context.repo.history.find(args.query, args.limit);
    return histories.map(x => x.toAPI(context.auth.tokenOrNull));
  },
  msgs: async (
    _obj,
    args,
    context,
    _info) => {
    const msgs = await context.repo.msg.find(context.auth.token, args.query, args.limit);
    return msgs.map(x => x.toAPI(context.auth.token));
  },
  profiles: async (
    _obj,
    args,
    context,
    _info) => {
    const profiles = await context.repo.profile.find(context.auth, args.query);
    return profiles.map(p => p.toAPI(context.auth.tokenOrNull));
  },
  reses: async (
    _obj,
    args,
    context,
    _info: any) => {
    const reses = await context.repo.res.find(context.auth, args.query, args.limit);
    return reses.map(x => x.toAPI(context.auth.tokenOrNull));
  },
  storages: async (
    _obj,
    args,
    context,
    _info) => {
    const storages = await context.repo.storage.find(context.auth.token, args.query);
    return storages.map(x => x.toAPI(context.auth.token));
  },
  token: async (
    _obj,
    _args,
    context,
    _info) => {
    const token = await context.repo.token.findOne(context.auth.token.id);
    return token.toAPI();
  },
  tokens: async (
    _obj,
    _args,
    context,
    _info: any) => {
    const tokens = await context.repo.token.findAll(context.auth.tokenMaster);
    return tokens.map(t => t.toAPI());
  },
  topics: async (
    _obj,
    args,
    context,
    _info) => {
    const topic = await context.repo.topic
      .find(args.query, args.skip, args.limit);
    return topic.map(t => t.toAPI());
  },
  topicTags: async (
    _obj,
    args,
    context,
    _info) => {
    return await context.repo.topic.findTags(args.limit);
  },
};
