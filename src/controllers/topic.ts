import { AtNotFoundError } from "../at-error";
import { ObjectIDGenerator } from "../generator";
import {
  IRepo,
  ITopicAPI,
  ITopicForkAPI,
  TopicFork,
  TopicNormal,
  TopicOne,
  TopicQuery,
} from "../models";
import {
  Context,
} from "../server";

export const topicResolver = (repo: IRepo) => {
  return {
    Query: {
      topics: async (
        _obj: any,
        args: {
          query: TopicQuery,
          skip: number,
          limit: number,
        },
        _context: Context,
        _info: any) => {
        const topic = await repo.topic
          .find(args.query, args.skip, args.limit);
        return topic.map(t => t.toAPI());
      },
      topicTags: async (
        _obj: any,
        args: {
          limit: number,
        },
        _context: Context,
        _info: any) => {
        return await repo.topic.findTags(args.limit);
      },
    },
    Mutation: {
      createTopicNormal: async (
        _obj: any,
        args: {
          title: string,
          tags: string[],
          text: string,
        },
        context: Context,
        _info: any) => {
        const user = await repo.user.findOne(context.auth.token.user);
        const create = TopicNormal.create(ObjectIDGenerator,
          args.title,
          args.tags,
          args.text,
          user,
          context.auth.token,
          context.now);

        await repo.topic.insert(create.topic);
        await Promise.all([
          repo.user.update(create.user),
          repo.res.insert(create.res),
          repo.history.insert(create.history),
        ]);
        context.log("topics", create.topic.id);
        context.log("reses", create.res.id);
        context.log("histories", create.history.id);
        return create.topic.toAPI();
      },
      createTopicOne: async (
        _obj: any,
        args: {
          title: string,
          tags: string[],
          text: string,
        },
        context: Context,
        _info: any) => {
        const user = await repo.user.findOne(context.auth.token.user);
        const create = TopicOne.create(ObjectIDGenerator,
          args.title,
          args.tags,
          args.text,
          user,
          context.auth.token,
          context.now);

        await repo.topic.insert(create.topic);
        await Promise.all([
          repo.user.update(create.user),
          repo.res.insert(create.res),
        ]);

        context.log("topics", create.topic.id);
        context.log("reses", create.res.id);

        return create.topic.toAPI();
      },
      createTopicFork: async (
        _obj: any,
        args: {
          title: string,
          parent: string,
        },
        context: Context,
        _info: any) => {
        const user = await repo.user.findOne(context.auth.token.user);
        const parent = await repo.topic.findOne(args.parent);

        if (parent.type !== "normal") {
          throw new AtNotFoundError("トピックが見つかりません");
        }

        const create = TopicFork.create(ObjectIDGenerator,
          args.title,
          parent,
          user,
          context.auth.token,
          context.now);

        await repo.topic.insert(create.topic);
        await repo.topic.update(create.parent);
        await Promise.all([
          repo.user.update(create.user),
          repo.res.insert(create.res),
          repo.res.insert(create.resParent),
        ]);

        context.log("topics", create.topic.id);
        context.log("reses", create.res.id);
        context.log("reses", create.resParent.id);

        return create.topic.toAPI();
      },
      updateTopic: async (
        _obj: any,
        args: {
          id: string,
          title?: string,
          tags?: string[],
          text?: string,
        },
        context: Context,
        _info: any) => {
        const [topic, user] = await Promise.all([
          repo.topic.findOne(args.id),
          repo.user.findOne(context.auth.token.user),
        ]);

        if (topic.type !== "normal") {
          throw new AtNotFoundError("トピックが見つかりません");
        }

        const val = topic.changeData(ObjectIDGenerator,
          user,
          context.auth.token,
          args.title,
          args.tags,
          args.text,
          context.now);

        await Promise.all([
          repo.res.insert(val.res),
          repo.history.insert(val.history),
          repo.topic.update(val.topic),
          repo.user.update(val.user),
        ]);

        context.log("reses", val.res.id);
        context.log("histories", val.history.id);
        return topic.toAPI();
      },
    },
    Topic: {
      __resolveType(obj: ITopicAPI) {
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
      __resolveType(obj: ITopicAPI) {
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
    TopicFork: {
      parent: async (
        token: ITopicForkAPI,
        _args: {},
        context: Context,
        _info: any) => {
        const parent = await context.loader.topic.load(token.parentID);
        return parent.toAPI();
      },
    },
  };
};
