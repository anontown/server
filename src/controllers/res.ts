import { AtPrerequisiteError } from "../at-error";
import { ObjectIDGenerator } from "../generator";
import {
  IResAPI,
  ResNormal,
} from "../models";
import {
  controller,
  http,
  IHttpAPICallParams
} from "../server";

@controller
export class ResController {
  @http({
    url: "/res/create",

    isAuthUser: false,
    isAuthToken: "all",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["topic", "name", "body", "reply", "profile", "age"],
      properties: {
        topic: {
          type: "string",
        },
        name: {
          type: ["string", "null"],
        },
        body: {
          type: "string",
        },
        reply: {
          type: ["string", "null"],
        },
        profile: {
          type: ["string", "null"],
        },
        age: {
          type: "boolean",
        },
      },
    },
  })
  async create({ params, auth, now, repo, log }: IHttpAPICallParams<{
    topic: string,
    name: string | null,
    body: string,
    reply: string | null,
    profile: string | null,
    age: boolean,
  }>): Promise<IResAPI> {
    const [topic, user, reply, profile] = await Promise.all([
      repo.topic.findOne(params.topic),
      repo.user.findOne(auth.token.user),
      params.reply !== null ? repo.res.findOne(params.reply) : Promise.resolve(null),
      params.profile !== null ? repo.profile.findOne(params.profile) : Promise.resolve(null),
    ]);

    const { res, user: newUser, topic: newTopic } = ResNormal.create(ObjectIDGenerator,
      topic,
      user,
      auth.token,
      params.name,
      params.body,
      reply,
      profile,
      params.age,
      now);

    await Promise.all([
      repo.res.insert(res),
      repo.topic.update(newTopic),
      repo.user.update(newUser),
    ]);

    log("reses", res.id);
    return res.toAPI(auth.token);
  }

  @http({
    url: "/res/find/one",

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
  async findOne({ params, auth, repo }: IHttpAPICallParams<{ id: string }>): Promise<IResAPI> {
    const res = await repo.res.findOne(params.id);
    return res.toAPI(auth.tokenOrNull);
  }

  @http({
    url: "/res/find/in",

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
  async findIn({ params, auth, repo }: IHttpAPICallParams<{ ids: string[] }>): Promise<IResAPI[]> {
    const reses = await repo.res.findIn(params.ids);
    return reses.map(r => r.toAPI(auth.tokenOrNull));
  }

  @http({
    url: "/res/find",

    isAuthUser: false,
    isAuthToken: "no",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["topic", "type", "equal", "date", "limit"],
      properties: {
        topic: {
          type: "string",
        },
        type: {
          type: "string",
          enum: ["before", "after"],
        },
        equal: {
          type: "boolean",
        },
        date: {
          type: "string",
          format: "date-time",
        },
        limit: {
          type: "number",
        },
      },
    },
  })
  async find({ params, auth, repo }: IHttpAPICallParams<{
    topic: string,
    type: "before" | "after",
    equal: boolean,
    date: string,
    limit: number,
  }>): Promise<IResAPI[]> {
    const topic = await repo.topic.findOne(params.topic);
    const reses = await repo.res.find(topic, params.type, params.equal, new Date(params.date), params.limit);
    return reses.map(r => r.toAPI(auth.tokenOrNull));
  }

  @http({
    url: "/res/find/new",

    isAuthUser: false,
    isAuthToken: "no",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["topic", "limit"],
      properties: {
        topic: {
          type: "string",
        },
        limit: {
          type: "number",
        },
      },
    },
  })
  async findNew({ params, auth, repo }: IHttpAPICallParams<{ topic: string, limit: number }>): Promise<IResAPI[]> {
    const topic = await repo.topic.findOne(params.topic);
    const reses = await repo.res.findNew(topic, params.limit);
    return reses.map(r => r.toAPI(auth.tokenOrNull));
  }

  @http({
    url: "/res/find/hash",

    isAuthUser: false,
    isAuthToken: "no",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["topic", "hash"],
      properties: {
        topic: {
          type: "string",
        },
        hash: {
          type: "string",
        },
      },
    },
  })
  async findHash({ params, auth, repo }: IHttpAPICallParams<{ topic: string, hash: string }>): Promise<IResAPI[]> {
    const topic = await repo.topic.findOne(params.topic);
    const reses = await repo.res.findHash(topic, params.hash);
    return reses.map(r => r.toAPI(auth.tokenOrNull));
  }

  @http({
    url: "/res/find/reply",

    isAuthUser: false,
    isAuthToken: "no",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["topic", "reply"],
      properties: {
        topic: {
          type: "string",
        },
        reply: {
          type: "string",
        },
      },
    },
  })
  async findReply({ params, auth, repo }: IHttpAPICallParams<{ topic: string, reply: string }>): Promise<IResAPI[]> {
    const [topic, res] = await Promise.all([
      repo.topic.findOne(params.topic),
      repo.res.findOne(params.reply),
    ]);

    const reses = await repo.res.findReply(topic, res);
    return reses.map(r => r.toAPI(auth.tokenOrNull));
  }

  @http({
    url: "/res/find/notice",

    isAuthUser: false,
    isAuthToken: "all",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["type", "equal", "date", "limit"],
      properties: {
        type: {
          type: "string",
          enum: ["before", "after"],
        },
        equal: {
          type: "boolean",
        },
        date: {
          type: "string",
          format: "date-time",
        },
        limit: {
          type: "number",
        },
      },
    },
  })
  async findNotice({ params, auth, repo }: IHttpAPICallParams<{
    type: "before" | "after",
    equal: boolean,
    date: string,
    limit: number,
  }>): Promise<IResAPI[]> {
    const res = await repo.res
      .findNotice(auth.token, params.type, params.equal, new Date(params.date), params.limit);
    return res.map(x => x.toAPI(auth.token));
  }

  @http({
    url: "/res/find/notice/new",

    isAuthUser: false,
    isAuthToken: "all",
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
  })
  async findNoticeNew({ params, auth, repo }: IHttpAPICallParams<{ limit: number }>): Promise<IResAPI[]> {
    const res = await repo.res.findNoticeNew(auth.token, params.limit);
    return res.map(x => x.toAPI(auth.token));
  }

  @http({
    url: "/res/uv",

    isAuthUser: false,
    isAuthToken: "all",
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
  async uv({ params, auth, repo }: IHttpAPICallParams<{ id: string }>): Promise<IResAPI> {
    const [res, user] = await Promise.all([
      repo.res.findOne(params.id),
      repo.user.findOne(auth.token.user),
    ]);

    // レスを書き込んだユーザー
    const resUser = await repo.user.findOne(res.user);

    const { res: newRes, resUser: newResUser } = res.v(resUser, user, "uv", auth.token);

    await Promise.all([
      repo.res.update(newRes),
      repo.user.update(newResUser),
      repo.user.update(user),
    ]);

    return newRes.toAPI(auth.token);
  }

  @http({
    url: "/res/dv",

    isAuthUser: false,
    isAuthToken: "all",
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
  async dv({ params, auth, repo }: IHttpAPICallParams<{ id: string }>): Promise<IResAPI> {
    const [res, user] = await Promise.all([
      repo.res.findOne(params.id),
      repo.user.findOne(auth.token.user),
    ]);

    // レスを書き込んだユーザー
    const resUser = await repo.user.findOne(res.user);

    const { res: newRes, resUser: newResUser } = res.v(resUser, user, "dv", auth.token);

    const promise = [
      repo.res.update(newRes),
      repo.user.update(newResUser),
      repo.user.update(user),
    ];

    await Promise.all(promise);

    return newRes.toAPI(auth.token);
  }

  @http({
    url: "/res/cv",

    isAuthUser: false,
    isAuthToken: "all",
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
  async cv({ params, auth, repo }: IHttpAPICallParams<{ id: string }>): Promise<IResAPI> {
    const [res, user] = await Promise.all([
      repo.res.findOne(params.id),
      repo.user.findOne(auth.token.user),
    ]);

    // レスを書き込んだユーザー
    const resUser = await repo.user.findOne(res.user);

    const { res: newRes, resUser: newResUser } = res.cv(resUser, user, auth.token);

    await Promise.all([
      repo.res.update(newRes),
      repo.user.update(newResUser),
      repo.user.update(user),
    ]);

    return newRes.toAPI(auth.token);
  }

  @http({
    url: "/res/del",

    isAuthUser: false,
    isAuthToken: "all",
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
  async del({ params, auth, repo }: IHttpAPICallParams<{ id: string }>): Promise<IResAPI> {
    // レス
    const res = await repo.res.findOne(params.id);

    if (res.type !== "normal") {
      throw new AtPrerequisiteError("通常レス以外は削除出来ません");
    }

    // レスを書き込んだユーザー
    const resUser = await repo.user.findOne(res.user);

    const { res: newRes, resUser: newResUser } = res.del(resUser, auth.token);

    await Promise.all([
      repo.res.update(newRes),
      repo.user.update(newResUser),
    ]);

    return newRes.toAPI(auth.token);
  }
}