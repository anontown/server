import { withFilter } from "apollo-server";
import { fromNullable, some } from "fp-ts/lib/Option";
import { AtNotFoundError } from "../at-error";
import { ObjectIDGenerator } from "../generator";
import {
  IHistoryAPI,
  IProfileAPI,
  IRepo,
  IResAPI,
  IResDeleteAPI,
  IResForkAPI,
  IResHistoryAPI,
  IResNormalAPI,
  ITopicAPI,
  ITopicForkAPI,
  Res,
  ResNormal,
  ResQuery,
} from "../models";
import {
  AppContext,
} from "../server";
import { observableAsyncIterator } from "../utils/index";

export const resResolver = (repo: IRepo) => {
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

  return {
    Query: {
      reses: async (
        _obj: any,
        args: {
          query: ResQuery,
          limit: number,
        },
        context: AppContext,
        _info: any): Promise<IResAPI[]> => {
        const reses = await repo.res.find(context.auth, args.query, args.limit);
        return reses.map(x => x.toAPI(context.auth.tokenOrNull));
      },
    },
    Mutation: {
      createRes: async (
        _obj: any,
        args: {
          topic: string,
          name?: string,
          text: string,
          reply?: string,
          profile?: string,
          age: boolean,
        },
        context: AppContext,
        _info: any): Promise<IResNormalAPI> => {
        const [topic, user, reply, profile] = await Promise.all([
          repo.topic.findOne(args.topic),
          repo.user.findOne(context.auth.token.user),
          args.reply !== undefined ? repo.res.findOne(args.reply) : Promise.resolve(null),
          args.profile !== undefined ? repo.profile.findOne(args.profile) : Promise.resolve(null),
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
          repo.res.insert(res),
          repo.topic.update(newTopic),
          repo.user.update(newUser),
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
        args: {
          id: string,
          vote: "uv" | "dv" | "cv",
        },
        context: AppContext,
        _info: any): Promise<IResAPI> => {
        if (args.vote === "cv") {
          const [res, user] = await Promise.all([
            repo.res.findOne(args.id),
            repo.user.findOne(context.auth.token.user),
          ]);

          // レスを書き込んだユーザー
          const resUser = await repo.user.findOne(res.user);

          const { res: newRes, resUser: newResUser } = res.cv(resUser, user, context.auth.token);

          await Promise.all([
            repo.res.update(newRes),
            repo.user.update(newResUser),
            repo.user.update(user),
          ]);

          return newRes.toAPI(some(context.auth.token));
        } else {
          const [res, user] = await Promise.all([
            repo.res.findOne(args.id),
            repo.user.findOne(context.auth.token.user),
          ]);

          // レスを書き込んだユーザー
          const resUser = await repo.user.findOne(res.user);

          const { res: newRes, resUser: newResUser } = res.v(resUser, user, args.vote, context.auth.token);

          await Promise.all([
            repo.res.update(newRes),
            repo.user.update(newResUser),
            repo.user.update(user),
          ]);

          return newRes.toAPI(some(context.auth.token));
        }
      },
      delRes: async (
        _obj: any,
        args: {
          id: string,
        },
        context: AppContext,
        _info: any): Promise<IResDeleteAPI> => {
        const res = await repo.res.findOne(args.id);

        if (res.type !== "normal") {
          throw new AtNotFoundError("レスが見つかりません");
        }

        // レスを書き込んだユーザー
        const resUser = await repo.user.findOne(res.user);

        const { res: newRes, resUser: newResUser } = res.del(resUser, context.auth.token);

        await Promise.all([
          repo.res.update(newRes),
          repo.user.update(newResUser),
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
        subscribe: (_parent: any, args: { topic: string }, context: AppContext, _info: any)
          : AsyncIterator<{ res: IResAPI, count: number }> =>
          observableAsyncIterator(repo.res.insertEvent
            .filter(x => x.res.topic === args.topic)
            .map(x => ({ count: x.count, res: x.res.toAPI(context.auth.tokenOrNull) }))),
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
};
