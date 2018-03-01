import { AtPrerequisiteError } from "../at-error";
import { ObjectIDGenerator } from "../generator";
import {
  IResAPI,
  ITopicAPI,
  TopicFork,
  TopicNormal,
  TopicOne,
} from "../models";
import { AppServer } from "../server";

export function addTopicAPI(api: AppServer) {
  api.addSocketAPI<{ id: string }, { res: IResAPI, count: number }>({
    name: "topic-update",

    isAuthUser: false,
    isAuthToken: "no",
    isRecaptcha: false,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["id"],
      properties: {
        id: {
          type: "string",
        },
      },
    },
    call: async ({ auth, params, repo }) => {
      const topic = await repo.topic.findOne(params.id);
      return repo.res
        .insertEvent
        .asObservable()
        .filter(x => x.res.topic === topic.id)
        .map(x => ({ ...x, res: x.res.toAPI(auth.tokenOrNull) }));
    },
  });

  api.addAPI<{
    title: string,
    tags: string[],
    body: string,
  }, ITopicAPI>({
    url: "/topic/create/normal",

    isAuthUser: false,
    isAuthToken: "all",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["title", "tags", "body"],
      properties: {
        title: {
          type: "string",
        },
        tags: {
          type: "array",
          items: {
            type: "string",
          },
        },
        body: {
          type: "string",
        },
      },
    },
    call: async ({ params, auth, log, now, repo }) => {
      const user = await repo.user.findOne(auth.token.user);
      const create = TopicNormal.create(ObjectIDGenerator,
        params.title,
        params.tags,
        params.body,
        user,
        auth.token,
        now);

      await repo.topic.insert(create.topic);
      await Promise.all([
        repo.user.update(create.user),
        repo.res.insert(create.res),
        repo.history.insert(create.history),
      ]);
      log("topics", create.topic.id);
      log("reses", create.res.id);
      log("histories", create.history.id);
      return create.topic.toAPI();
    },
  });

  api.addAPI<{
    title: string,
    tags: string[],
    body: string,
  }, ITopicAPI>({
    url: "/topic/create/one",

    isAuthUser: false,
    isAuthToken: "all",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["title", "tags", "body"],
      properties: {
        title: {
          type: "string",
        },
        tags: {
          type: "array",
          items: {
            type: "string",
          },
        },
        body: {
          type: "string",
        },
      },
    },
    call: async ({ params, auth, log, now, repo }) => {
      const user = await repo.user.findOne(auth.token.user);
      const create = TopicOne.create(ObjectIDGenerator,
        params.title,
        params.tags,
        params.body,
        user,
        auth.token,
        now);

      await repo.topic.insert(create.topic);
      await Promise.all([
        repo.user.update(create.user),
        repo.res.insert(create.res),
      ]);

      log("topics", create.topic.id);
      log("reses", create.res.id);

      return create.topic.toAPI();
    },
  });

  api.addAPI<{
    title: string,
    parent: string,
  }, ITopicAPI>({
    url: "/topic/create/fork",

    isAuthUser: false,
    isAuthToken: "all",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["title", "parent"],
      properties: {
        title: {
          type: "string",
        },
        parent: {
          type: "string",
        },
      },
    },
    call: async ({ params, auth, log, now, repo }) => {
      const user = await repo.user.findOne(auth.token.user);
      const parent = await repo.topic.findOne(params.parent);

      if (parent.type !== "normal") {
        throw new AtPrerequisiteError("通常トピック以外の派生トピックは作れません");
      }

      const create = TopicFork.create(ObjectIDGenerator,
        params.title,
        parent,
        user,
        auth.token,
        now);

      await repo.topic.insert(create.topic);
      await repo.topic.update(create.parent);
      await Promise.all([
        repo.user.update(create.user),
        repo.res.insert(create.res),
        repo.res.insert(create.resParent),
      ]);

      log("topics", create.topic.id);
      log("reses", create.res.id);
      log("reses", create.resParent.id);

      return create.topic.toAPI();
    },
  });

  api.addAPI<{ id: string }, ITopicAPI>({
    url: "/topic/find/one",

    isAuthUser: false,
    isAuthToken: "no",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["id"],
      properties: {
        id: {
          type: "string",
        },
      },
    },
    call: async ({ params, repo }) => {
      const topic = await repo.topic.findOne(params.id);
      return topic.toAPI();
    },
  });

  api.addAPI<{ ids: string[] }, ITopicAPI[]>({
    url: "/topic/find/in",

    isAuthUser: false,
    isAuthToken: "no",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["ids"],
      properties: {
        ids: {
          type: "array",
          items: {
            type: "string",
          },
        },
      },
    },
    call: async ({ params, repo }) => {
      const topics = await repo.topic.findIn(params.ids);
      return topics.map(t => t.toAPI());
    },
  });

  api.addAPI<{
    title: string[],
    tags: string[],
    skip: number,
    limit: number,
    activeOnly: boolean,
  }, ITopicAPI[]>({
    url: "/topic/find",

    isAuthUser: false,
    isAuthToken: "no",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["title", "tags", "skip", "limit", "activeOnly"],
      properties: {
        title: {
          type: "array",
          items: {
            type: "string",
          },
        },
        tags: {
          type: "array",
          items: {
            type: "string",
          },
        },
        skip: {
          type: "number",
        },
        limit: {
          type: "number",
        },
        activeOnly: {
          type: "boolean",
        },
      },
    },
    call: async ({ params, repo }) => {
      const topic = await repo.topic
        .find(params.title, params.tags, params.skip, params.limit, params.activeOnly);
      return topic.map(t => t.toAPI());
    },
  });

  api.addAPI<{
    parent: string,
    skip: number,
    limit: number,
    activeOnly: boolean,
  }, ITopicAPI[]>({
    url: "/topic/find/fork",

    isAuthUser: false,
    isAuthToken: "no",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["parent", "skip", "limit", "activeOnly"],
      properties: {
        parent: {
          type: "string",
        },
        skip: {
          type: "number",
        },
        limit: {
          type: "number",
        },
        activeOnly: {
          type: "boolean",
        },
      },
    },
    call: async ({ params, repo }) => {
      const parent = await repo.topic.findOne(params.parent);
      if (parent.type !== "normal") {
        throw new AtPrerequisiteError("親トピックは通常トピックのみ指定できます");
      }

      const topic = await repo.topic.findFork(parent, params.skip, params.limit, params.activeOnly);
      return topic.map(t => t.toAPI());
    },
  });

  api.addAPI<{ limit: number }, Array<{ name: string, count: number }>>({
    url: "/topic/find/tags",

    isAuthUser: false,
    isAuthToken: "no",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["limit"],
      properties: {
        limit: {
          type: "number",
        },
      },
    },
    call: async ({ params, repo }) => {
      return await repo.topic.findTags(params.limit);
    },
  });

  api.addAPI<{
    id: string,
    title: string,
    tags: string[],
    body: string,
  }, ITopicAPI>({
    url: "/topic/update",

    isAuthUser: false,
    isAuthToken: "all",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["id", "title", "tags", "body"],
      properties: {
        id: {
          type: "string",
        },
        title: {
          type: "string",
        },
        tags: {
          type: "array",
          items: {
            type: "string",
          },
        },
        body: {
          type: "string",
        },
      },
    },
    call: async ({ params, auth, log, now, repo }) => {
      const [topic, user] = await Promise.all([
        repo.topic.findOne(params.id),
        repo.user.findOne(auth.token.user),
      ]);

      if (topic.type !== "normal") {
        throw new AtPrerequisiteError("通常トピック以外は編集出来ません");
      }

      const val = topic.changeData(ObjectIDGenerator, user, auth.token, params.title, params.tags, params.body, now);

      await Promise.all([
        repo.res.insert(val.res),
        repo.history.insert(val.history),
        repo.topic.update(val.topic),
        repo.user.update(val.user),
      ]);

      log("reses", val.res.id);
      log("histories", val.history.id);
      return topic.toAPI();
    },
  });

}