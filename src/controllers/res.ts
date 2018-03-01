import { AppServer } from "../server";
import { AtPrerequisiteError } from "../at-error";
import { ObjectIDGenerator } from "../generator";
import {
  IResAPI,
  ResNormal,
} from "../models";

export function addResAPI(api: AppServer) {
  api.addAPI<{
    topic: string,
    name: string | null,
    body: string,
    reply: string | null,
    profile: string | null,
    age: boolean,
  }, IResAPI>({
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
    call: async ({ params, auth, now, repo, log }) => {
      const val = await Promise.all([
        repo.topic.findOne(params.topic),
        repo.user.findOne(auth.token.user),
        params.reply !== null ? repo.res.findOne(params.reply) : Promise.resolve(null),
        params.profile !== null ? repo.profile.findOne(params.profile) : Promise.resolve(null),
      ]);

      const topic = val[0];
      const user = val[1];
      const reply = val[2];
      const profile = val[3];
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
    },
  });

  api.addAPI<{ id: string }, IResAPI>({
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
    call: async ({ params, auth, repo }) => {
      const res = await repo.res.findOne(params.id);
      return res.toAPI(auth.tokenOrNull);
    },
  });

  api.addAPI<{ ids: string[] }, IResAPI[]>({
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
    call: async ({ params, auth, repo }) => {
      const reses = await repo.res.findIn(params.ids);
      return reses.map(r => r.toAPI(auth.tokenOrNull));
    },
  });

  api.addAPI<{
    topic: string,
    type: "before" | "after",
    equal: boolean,
    date: string,
    limit: number,
  }, IResAPI[]>({
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
    call: async ({ params, auth, repo }) => {
      const topic = await repo.topic.findOne(params.topic);
      const reses = await repo.res.find(topic, params.type, params.equal, new Date(params.date), params.limit);
      return reses.map(r => r.toAPI(auth.tokenOrNull));
    },
  });

  api.addAPI<{ topic: string, limit: number }, IResAPI[]>({
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
    call: async ({ params, auth, repo }) => {
      const topic = await repo.topic.findOne(params.topic);
      const reses = await repo.res.findNew(topic, params.limit);
      return reses.map(r => r.toAPI(auth.tokenOrNull));
    },
  });

  api.addAPI<{ topic: string, hash: string }, IResAPI[]>({
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
    call: async ({ params, auth, repo }) => {
      const topic = await repo.topic.findOne(params.topic);
      const reses = await repo.res.findHash(topic, params.hash);
      return reses.map(r => r.toAPI(auth.tokenOrNull));
    },
  });

  api.addAPI<{ topic: string, reply: string }, IResAPI[]>({
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
    call: async ({ params, auth, repo }) => {
      const val = await Promise.all([
        repo.topic.findOne(params.topic),
        repo.res.findOne(params.reply),
      ]);

      const topic = val[0];
      const res = val[1];

      const reses = await repo.res.findReply(topic, res);
      return reses.map(r => r.toAPI(auth.tokenOrNull));
    },
  });

  api.addAPI<{
    type: "before" | "after",
    equal: boolean,
    date: string,
    limit: number,
  }, IResAPI[]>({
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
    call: async ({ params, auth, repo }) => {
      const res = await repo.res
        .findNotice(auth.token, params.type, params.equal, new Date(params.date), params.limit);
      return res.map(x => x.toAPI(auth.token));
    },
  });

  api.addAPI<{ limit: number }, IResAPI[]>({
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
    call: async ({ params, auth, repo }) => {
      const res = await repo.res.findNoticeNew(auth.token, params.limit);
      return res.map(x => x.toAPI(auth.token));
    },
  });

  api.addAPI<{ id: string }, IResAPI>({
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
    call: async ({ params, auth, repo }) => {
      const val = await Promise.all([
        repo.res.findOne(params.id),
        repo.user.findOne(auth.token.user),
      ]);

      // レス
      const res = val[0];

      // 投票するユーザー
      const user = val[1];

      // レスを書き込んだユーザー
      const resUser = await repo.user.findOne(res.user);

      const { res: newRes, resUser: newResUser } = res.v(resUser, user, "uv", auth.token);

      await Promise.all([
        repo.res.update(newRes),
        repo.user.update(newResUser),
        repo.user.update(user),
      ]);

      return newRes.toAPI(auth.token);
    },
  });

  api.addAPI<{ id: string }, IResAPI>({
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
    call: async ({ params, auth, repo }) => {
      const val = await Promise.all([
        repo.res.findOne(params.id),
        repo.user.findOne(auth.token.user),
      ]);

      const res = val[0];

      // 投票するユーザー
      const user = val[1];

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
    },
  });

  api.addAPI<{ id: string }, IResAPI>({
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
    call: async ({ params, auth, repo }) => {
      const val = await Promise.all([
        repo.res.findOne(params.id),
        repo.user.findOne(auth.token.user),
      ]);

      // レス
      const res = val[0];

      // 投票するユーザー
      const user = val[1];

      // レスを書き込んだユーザー
      const resUser = await repo.user.findOne(res.user);

      const { res: newRes, resUser: newResUser } = res.cv(resUser, user, auth.token);

      await Promise.all([
        repo.res.update(newRes),
        repo.user.update(newResUser),
        repo.user.update(user),
      ]);

      return newRes.toAPI(auth.token);
    },
  });

  api.addAPI<{ id: string }, IResAPI>({
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
    call: async ({ params, auth, repo }) => {
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
    },
  });

}