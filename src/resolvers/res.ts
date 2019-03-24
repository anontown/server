import { withFilter } from "apollo-server";
import { fromNullable, some } from "fp-ts/lib/Option";
import { AtNotFoundError } from "../at-error";
import { ObjectIDGenerator } from "../generator";
import {
  IHistoryAPI,
  IProfileAPI,
  IResAPI,
  IResDeleteAPI,
  IResForkAPI,
  IResHistoryAPI,
  IResNormalAPI,
  ITopicAPI,
  ITopicForkAPI,
  ResNormal,
} from "../models";
import {
  AppContext,
} from "../server";
import { observableAsyncIterator } from "../utils/index";
import * as op from "rxjs/operators";
import * as G from "../generated/graphql";
import { isNullish } from "@kgtkr/utils";

const resBase = {
  topic: async (
    res: IResAPI,
    _args: {},
    context: AppContext,
    _info: any): Promise<ITopicAPI> => {
    const topic = await context.loader.topic.load(res.topicID);
    return topic.toAPI();
  },
};

export const resResolver = {
  Query: {
    reses: async (
      _obj: any,
      args: G.QueryResesArgs,
      context: AppContext,
      _info: any): Promise<IResAPI[]> => {
      const reses = await context.repo.res.find(context.auth, args.query, args.limit);
      return reses.map(x => x.toAPI(context.auth.tokenOrNull));
    },
  },
  Mutation: {
    createRes: async (
      _obj: any,
      args: G.MutationCreateResArgs,
      context: AppContext,
      _info: any): Promise<IResNormalAPI> => {
      const [topic, user, reply, profile] = await Promise.all([
        context.repo.topic.findOne(args.topic),
        context.repo.user.findOne(context.auth.token.user),
        !isNullish(args.reply) ? context.repo.res.findOne(args.reply) : Promise.resolve(null),
        !isNullish(args.profile) ? context.repo.profile.findOne(args.profile) : Promise.resolve(null),
      ]);

      const { res, user: newUser, topic: newTopic } = ResNormal.create(ObjectIDGenerator,
        topic,
        user,
        context.auth.token,
        fromNullable(args.name),
        args.text,
        fromNullable(reply),
        fromNullable(profile),
        args.age,
        context.now);

      await Promise.all([
        context.repo.res.insert(res),
        context.repo.topic.update(newTopic),
        context.repo.user.update(newUser),
      ]);

      context.log("reses", res.id);
      const api = res.toAPI(some(context.auth.token));
      if (api.type !== "normal") {
        throw new Error();
      }
      return api;
    },
    voteRes: async (
      _obj: any,
      args: G.MutationVoteResArgs,
      context: AppContext,
      _info: any): Promise<IResAPI> => {
      if (args.type === "cv") {
        const [res, user] = await Promise.all([
          context.repo.res.findOne(args.res),
          context.repo.user.findOne(context.auth.token.user),
        ]);

        // レスを書き込んだユーザー
        const resUser = await context.repo.user.findOne(res.user);

        const { res: newRes, resUser: newResUser } = res.cv(resUser, user, context.auth.token);

        await Promise.all([
          context.repo.res.update(newRes),
          context.repo.user.update(newResUser),
          context.repo.user.update(user),
        ]);

        return newRes.toAPI(some(context.auth.token));
      } else {
        const [res, user] = await Promise.all([
          context.repo.res.findOne(args.res),
          context.repo.user.findOne(context.auth.token.user),
        ]);

        // レスを書き込んだユーザー
        const resUser = await context.repo.user.findOne(res.user);

        const { res: newRes, resUser: newResUser } = res.v(resUser, user, args.type, context.auth.token);

        await Promise.all([
          context.repo.res.update(newRes),
          context.repo.user.update(newResUser),
          context.repo.user.update(user),
        ]);

        return newRes.toAPI(some(context.auth.token));
      }
    },
    delRes: async (
      _obj: any,
      args: G.MutationDelResArgs,
      context: AppContext,
      _info: any): Promise<IResDeleteAPI> => {
      const res = await context.repo.res.findOne(args.res);

      if (res.type !== "normal") {
        throw new AtNotFoundError("レスが見つかりません");
      }

      // レスを書き込んだユーザー
      const resUser = await context.repo.user.findOne(res.user);

      const { res: newRes, resUser: newResUser } = res.del(resUser, context.auth.token);

      await Promise.all([
        context.repo.res.update(newRes),
        context.repo.user.update(newResUser),
      ]);

      const api = newRes.toAPI(some(context.auth.token));
      if (api.type !== "delete") {
        throw new Error();
      }
      return api;
    },
  },
  Subscription: {
    resAdded: {
      subscribe: (_parent: any, args: G.SubscriptionResAddedArgs, context: AppContext, _info: any)
        : AsyncIterator<{ res: IResAPI, count: number }> =>
        observableAsyncIterator(context.repo.res.insertEvent
          .pipe(
            op.filter(x => x.res.topic === args.topic),
            op.map(x => ({ count: x.count, res: x.res.toAPI(context.auth.tokenOrNull) }))
          )),
    },
  },
  Res: {
    __resolveType(obj: IResAPI): "ResNormal" | "ResHistory" | "ResTopic" | "ResFork" | "ResDelete" {
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
  },
  ResNormal: {
    ...resBase,
    reply: async (
      res: IResNormalAPI,
      _args: {},
      context: AppContext,
      _info: any): Promise<IResAPI | null> => {
      if (res.replyID !== null) {
        const reply = await context.loader.res.load(res.replyID);
        return reply.toAPI(context.auth.tokenOrNull);
      } else {
        return null;
      }
    },
    profile: async (
      res: IResNormalAPI,
      _args: {},
      context: AppContext,
      _info: any): Promise<IProfileAPI | null> => {
      if (res.profileID !== null) {
        const profile = await context.loader.profile.load(res.profileID);
        return profile.toAPI(context.auth.tokenOrNull);
      } else {
        return null;
      }
    },
  },
  ResHistory: {
    ...resBase,
    history: async (
      res: IResHistoryAPI,
      _args: {},
      context: AppContext,
      _info: any): Promise<IHistoryAPI> => {
      const history = await context.loader.history.load(res.historyID);
      return history.toAPI(context.auth.tokenOrNull);
    },
  },
  ResTopic: {
    ...resBase,
  },
  ResFork: {
    ...resBase,
    fork: async (
      res: IResForkAPI,
      _args: {},
      context: AppContext,
      _info: any): Promise<ITopicForkAPI> => {
      const fork = await context.loader.topic.load(res.forkID);
      if (fork.type !== "fork") {
        throw new Error();
      }
      return fork.toAPI();
    },
  },
  ResDelete: {
    ...resBase,
  },
};