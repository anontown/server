import { AtNotFoundError } from "../at-error";
import { ObjectIDGenerator } from "../generator";
import {
  IRepo,
  ITopicAPI,
  ITopicForkAPI,
  ITopicNormalAPI,
  ITopicOneAPI,
  ITopicSearchAPI,
  TopicFork,
  TopicNormal,
  TopicOne,
} from "../models";
import {
  AppContext,
} from "../server";
import * as G from "../generated/graphql";
import { nullToUndefined } from "@kgtkr/utils";

export const topicResolver = {
  Query: {
    topics: async (
      _obj: any,
      args: G.QueryTopicsArgs,
      context: AppContext,
      _info: any): Promise<ITopicAPI[]> => {
      const topic = await context.repo.topic
        .find(args.query, args.skip, args.limit);
      return topic.map(t => t.toAPI());
    },
    topicTags: async (
      _obj: any,
      args: G.QueryTopicTagsArgs,
      context: AppContext,
      _info: any): Promise<{
        name: string;
        count: number;
      }[]> => {
      return await context.repo.topic.findTags(args.limit);
    },
  },
  Mutation: {
    createTopicNormal: async (
      _obj: any,
      args: G.MutationCreateTopicNormalArgs,
      context: AppContext,
      _info: any): Promise<ITopicNormalAPI> => {
      const user = await context.repo.user.findOne(context.auth.token.user);
      const create = TopicNormal.create(ObjectIDGenerator,
        args.title,
        args.tags,
        args.text,
        user,
        context.auth.token,
        context.now);

      await context.repo.topic.insert(create.topic);
      await Promise.all([
        context.repo.user.update(create.user),
        context.repo.res.insert(create.res),
        context.repo.history.insert(create.history),
      ]);
      context.log("topics", create.topic.id);
      context.log("reses", create.res.id);
      context.log("histories", create.history.id);
      return create.topic.toAPI();
    },
    createTopicOne: async (
      _obj: any,
      args: G.MutationCreateTopicOneArgs,
      context: AppContext,
      _info: any): Promise<ITopicOneAPI> => {
      const user = await context.repo.user.findOne(context.auth.token.user);
      const create = TopicOne.create(ObjectIDGenerator,
        args.title,
        args.tags,
        args.text,
        user,
        context.auth.token,
        context.now);

      await context.repo.topic.insert(create.topic);
      await Promise.all([
        context.repo.user.update(create.user),
        context.repo.res.insert(create.res),
      ]);

      context.log("topics", create.topic.id);
      context.log("reses", create.res.id);

      return create.topic.toAPI();
    },
    createTopicFork: async (
      _obj: any,
      args: G.MutationCreateTopicForkArgs,
      context: AppContext,
      _info: any): Promise<ITopicForkAPI> => {
      const user = await context.repo.user.findOne(context.auth.token.user);
      const parent = await context.repo.topic.findOne(args.parent);

      if (parent.type !== "normal") {
        throw new AtNotFoundError("トピックが見つかりません");
      }

      const create = TopicFork.create(ObjectIDGenerator,
        args.title,
        parent,
        user,
        context.auth.token,
        context.now);

      await context.repo.topic.insert(create.topic);
      await context.repo.topic.update(create.parent);
      await Promise.all([
        context.repo.user.update(create.user),
        context.repo.res.insert(create.res),
        context.repo.res.insert(create.resParent),
      ]);

      context.log("topics", create.topic.id);
      context.log("reses", create.res.id);
      context.log("reses", create.resParent.id);

      return create.topic.toAPI();
    },
    updateTopic: async (
      _obj: any,
      args: G.MutationUpdateTopicArgs,
      context: AppContext,
      _info: any): Promise<ITopicNormalAPI> => {
      const [topic, user] = await Promise.all([
        context.repo.topic.findOne(args.id),
        context.repo.user.findOne(context.auth.token.user),
      ]);

      if (topic.type !== "normal") {
        throw new AtNotFoundError("トピックが見つかりません");
      }

      const val = topic.changeData(ObjectIDGenerator,
        user,
        context.auth.token,
        nullToUndefined(args.title),
        nullToUndefined(args.tags),
        nullToUndefined(args.text),
        context.now);

      await Promise.all([
        context.repo.res.insert(val.res),
        context.repo.history.insert(val.history),
        context.repo.topic.update(val.topic),
        context.repo.user.update(val.user),
      ]);

      context.log("reses", val.res.id);
      context.log("histories", val.history.id);
      return topic.toAPI();
    },
  },
  Topic: {
    __resolveType(obj: ITopicAPI): "TopicNormal" | "TopicOne" | "TopicFork" {
      switch (obj.type) {
        case "normal":
          return "TopicNormal";
        case "one":
          return "TopicOne";
        case "fork":
          return "TopicFork";
      }
    },
  },
  TopicSearch: {
    __resolveType(obj: ITopicSearchAPI): "TopicNormal" | "TopicOne" {
      switch (obj.type) {
        case "normal":
          return "TopicNormal";
        case "one":
          return "TopicOne";
      }
    },
  },
  TopicFork: {
    parent: async (
      token: ITopicForkAPI,
      _args: {},
      context: AppContext,
      _info: any): Promise<ITopicNormalAPI> => {
      const parent = await context.loader.topic.load(token.parentID);
      if (parent.type !== "normal") {
        throw new Error();
      }
      return parent.toAPI();
    },
  },
};