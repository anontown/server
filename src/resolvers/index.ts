import * as G from "../generated/graphql";
import { history } from "./history";
import { mutation } from "./mutation";
import { query } from "./query";
import { res, resDelete, resFork, resHistory, resNormal, resTopic } from "./res";
import { subscription } from "./subscription";
import { token, tokenGeneral } from "./token";
import { topic, topicFork, topicSearch } from "./topic";

export const resolvers: G.Resolvers = {
  History: history,
  Mutation: mutation,
  Query: query,
  Res: res,
  ResNormal: resNormal,
  ResHistory: resHistory,
  ResTopic: resTopic,
  ResDelete: resDelete,
  ResFork: resFork,
  Subscription: subscription,
  Token: token,
  TokenGeneral: tokenGeneral,
  Topic: topic,
  TopicSearch: topicSearch,
  TopicFork: topicFork,
};
