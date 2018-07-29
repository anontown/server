import { Observable } from "rxjs";
import { AtPrerequisiteError } from "../at-error";
import { ObjectIDGenerator } from "../generator";
import {
  IResAPI,
  ITopicAPI,
  TopicFork,
  TopicNormal,
  TopicOne,
} from "../models";
import {
  controller,
  http,
  IHttpAPICallParams,
  ISocketAPICallParams,
  socket,
  Context,
} from "../server";

export const topicResolver = {
  Query: {
    topics: async (_obj: any,
      args: {
        id: string[] | null,
        title: string | null,
        tags: string[] | null,
        skip: number,
        limit: number,
        activeOnly: boolean | null,
        parent: string | null
      }, context: Context,
      _info: any) => {
      const topic = await context.repo.topic
        .find2({
          id: args.id,
          title: args.title,
          tags: args.tags,
          activeOnly: args.activeOnly,
          parent: args.parent
        }, args.skip, args.limit),
      return topic.map(t => t.toAPI());
    },
  },
  Mutation: {}
};

@controller
export class TopicController {
  @socket({
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
  })
  async updateTopicStream({ auth, params, repo }: ISocketAPICallParams<{ id: string }>)
    : Promise<Observable<{ res: IResAPI, count: number }>> {
    const topic = await repo.topic.findOne(params.id);
    return repo.res
      .insertEvent
      .asObservable()
      .filter(x => x.res.topic === topic.id)
      .map(x => ({ ...x, res: x.res.toAPI(auth.tokenOrNull) }));
  }

  @http({
    url: "/topic/create/normal",

    isAuthUser: false,
    isAuthToken: "all",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["title", "tags", "text"],
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
        text: {
          type: "string",
        },
      },
    },
  })
  async createNormal({ params, auth, log, now, repo }: IHttpAPICallParams<{
    title: string,
    tags: string[],
    text: string,
  }>): Promise<ITopicAPI> {
    const user = await repo.user.findOne(auth.token.user);
    const create = TopicNormal.create(ObjectIDGenerator,
      params.title,
      params.tags,
      params.text,
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
  }

  @http({
    url: "/topic/create/one",

    isAuthUser: false,
    isAuthToken: "all",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["title", "tags", "text"],
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
        text: {
          type: "string",
        },
      },
    },
  })
  async createOne({ params, auth, log, now, repo }: IHttpAPICallParams<{
    title: string,
    tags: string[],
    text: string,
  }>): Promise<ITopicAPI> {
    const user = await repo.user.findOne(auth.token.user);
    const create = TopicOne.create(ObjectIDGenerator,
      params.title,
      params.tags,
      params.text,
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
  }

  @http({
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
  })
  async createFork({ params, auth, log, now, repo }: IHttpAPICallParams<{
    title: string,
    parent: string,
  }>): Promise<ITopicAPI> {
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
  }

  @http({
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
  })
  async findOne({ params, repo }: IHttpAPICallParams<{ id: string }>): Promise<ITopicAPI> {
    const topic = await repo.topic.findOne(params.id);
    return topic.toAPI();
  }

  @http({
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
  })
  async findIn({ params, repo }: IHttpAPICallParams<{ ids: string[] }>): Promise<ITopicAPI[]> {
    const topics = await repo.topic.findIn(params.ids);
    return topics.map(t => t.toAPI());
  }

  @http({
    url: "/topic/find",

    isAuthUser: false,
    isAuthToken: "no",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["title", "tags", "skip", "limit", "activeOnly"],
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
        skip: {
          type: "integer",
        },
        limit: {
          type: "integer",
        },
        activeOnly: {
          type: "boolean",
        },
      },
    },
  })
  async find({ params, repo }: IHttpAPICallParams<{
    title: string,
    tags: string[],
    skip: number,
    limit: number,
    activeOnly: boolean,
  }>): Promise<ITopicAPI[]> {
    const topic = await repo.topic
      .find(params.title, params.tags, params.skip, params.limit, params.activeOnly);
    return topic.map(t => t.toAPI());
  }

  @http({
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
          type: "integer",
        },
        limit: {
          type: "integer",
        },
        activeOnly: {
          type: "boolean",
        },
      },
    },
  })
  async findFork({ params, repo }: IHttpAPICallParams<{
    parent: string,
    skip: number,
    limit: number,
    activeOnly: boolean,
  }>): Promise<ITopicAPI[]> {
    const parent = await repo.topic.findOne(params.parent);
    if (parent.type !== "normal") {
      throw new AtPrerequisiteError("親トピックは通常トピックのみ指定できます");
    }

    const topic = await repo.topic.findFork(parent.id, params.skip, params.limit, params.activeOnly);
    return topic.map(t => t.toAPI());
  }

  @http({
    url: "/topic/find/tags",

    isAuthUser: false,
    isAuthToken: "no",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["limit"],
      properties: {
        limit: {
          type: "integer",
        },
      },
    },
  })
  async findTags({ params, repo }: IHttpAPICallParams<{ limit: number }>)
    : Promise<{ name: string, count: number }[]> {
    return await repo.topic.findTags(params.limit);
  }

  @http({
    url: "/topic/update",

    isAuthUser: false,
    isAuthToken: "all",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["id", "title", "tags", "text"],
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
        text: {
          type: "string",
        },
      },
    },
  })
  async updateTopic({ params, auth, log, now, repo }: IHttpAPICallParams<{
    id: string,
    title: string,
    tags: string[],
    text: string,
  }>): Promise<ITopicAPI> {
    const [topic, user] = await Promise.all([
      repo.topic.findOne(params.id),
      repo.user.findOne(auth.token.user),
    ]);

    if (topic.type !== "normal") {
      throw new AtPrerequisiteError("通常トピック以外は編集出来ません");
    }

    const val = topic.changeData(ObjectIDGenerator, user, auth.token, params.title, params.tags, params.text, now);

    await Promise.all([
      repo.res.insert(val.res),
      repo.history.insert(val.history),
      repo.topic.update(val.topic),
      repo.user.update(val.user),
    ]);

    log("reses", val.res.id);
    log("histories", val.history.id);
    return topic.toAPI();
  }
}
