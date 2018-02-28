/* tslint:disable:no-var-requires */
require("source-map-support").install();
import * as fs from "fs-promise";
import { AtPrerequisiteError } from "./at-error";
import { Config } from "./config";
import { createDB } from "./create-db";
import { ObjectIDGenerator, RandomGenerator } from "./generator";
import { Logger } from "./logger";
import {
  Client,
  ClientRepo,
  HistoryRepo,
  IClientAPI,
  IHistoryAPI,
  IMsgAPI,
  IProfileAPI,
  IResAPI,
  ITokenAPI,
  ITokenGeneralAPI,
  ITokenMasterAPI,
  ITokenReqAPI,
  ITopicAPI,
  IUserAPI,
  MsgRepo,
  Profile,
  ProfileRepo,
  ResNormal,
  ResRepo,
  TokenGeneral,
  TokenMaster,
  TokenRepo,
  TopicFork,
  TopicNormal,
  TopicOne,
  TopicRepo,
  User,
  UserRepo,
} from "./models";
import { AppServer } from "./server/app-server";

(async () => {
  // フォルダ作成
  try {
    await fs.mkdir("logs");
  } catch {
    /* tslint:disable:no-empty */
  }

  try {
    await fs.mkdir("data");
  } catch {
    /* tslint:disable:no-empty */
  }

  // ロガー
  function appLog(method: string, ip: string, idName: string, id: string) {
    Logger.app.info(method, ip, idName, id);
  }

  await createDB();

  const api = new AppServer(Config.server.port);

  // [res]
  {
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
      call: async ({ params, auth, ip, now }) => {
        const val = await Promise.all([
          TopicRepo.findOne(params.topic),
          UserRepo.findOne(auth.token.user),
          params.reply !== null ? ResRepo.findOne(params.reply) : Promise.resolve(null),
          params.profile !== null ? ProfileRepo.findOne(params.profile) : Promise.resolve(null),
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
          ResRepo.insert(res),
          TopicRepo.update(newTopic),
          UserRepo.update(newUser),
        ]);

        appLog("create/res", ip, "reses", res.id);
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
      call: async ({ params, auth }) => {
        const res = await ResRepo.findOne(params.id);
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
      call: async ({ params, auth }) => {
        const reses = await ResRepo.findIn(params.ids);
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
      call: async ({ params, auth }) => {
        const topic = await TopicRepo.findOne(params.topic);
        const reses = await ResRepo.find(topic, params.type, params.equal, new Date(params.date), params.limit);
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
      call: async ({ params, auth }) => {
        const topic = await TopicRepo.findOne(params.topic);
        const reses = await ResRepo.findNew(topic, params.limit);
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
      call: async ({ params, auth }) => {
        const topic = await TopicRepo.findOne(params.topic);
        const reses = await ResRepo.findHash(topic, params.hash);
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
      call: async ({ params, auth }) => {
        const val = await Promise.all([
          TopicRepo.findOne(params.topic),
          ResRepo.findOne(params.reply),
        ]);

        const topic = val[0];
        const res = val[1];

        const reses = await ResRepo.findReply(topic, res);
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
      call: async ({ params, auth }) => {
        const res = await ResRepo
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
      call: async ({ params, auth }) => {
        const res = await ResRepo.findNoticeNew(auth.token, params.limit);
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
      call: async ({ params, auth }) => {
        const val = await Promise.all([
          ResRepo.findOne(params.id),
          UserRepo.findOne(auth.token.user),
        ]);

        // レス
        const res = val[0];

        // 投票するユーザー
        const user = val[1];

        // レスを書き込んだユーザー
        const resUser = await UserRepo.findOne(res.user);

        const { res: newRes, resUser: newResUser } = res.v(resUser, user, "uv", auth.token);

        await Promise.all([
          ResRepo.update(newRes),
          UserRepo.update(newResUser),
          UserRepo.update(user),
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
      call: async ({ params, auth }) => {
        const val = await Promise.all([
          ResRepo.findOne(params.id),
          UserRepo.findOne(auth.token.user),
        ]);

        const res = val[0];

        // 投票するユーザー
        const user = val[1];

        // レスを書き込んだユーザー
        const resUser = await UserRepo.findOne(res.user);

        const { res: newRes, resUser: newResUser } = res.v(resUser, user, "dv", auth.token);

        const promise = [
          ResRepo.update(newRes),
          UserRepo.update(newResUser),
          UserRepo.update(user),
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
      call: async ({ params, auth }) => {
        const val = await Promise.all([
          ResRepo.findOne(params.id),
          UserRepo.findOne(auth.token.user),
        ]);

        // レス
        const res = val[0];

        // 投票するユーザー
        const user = val[1];

        // レスを書き込んだユーザー
        const resUser = await UserRepo.findOne(res.user);

        const { res: newRes, resUser: newResUser } = res.cv(resUser, user, auth.token);

        await Promise.all([
          ResRepo.update(newRes),
          UserRepo.update(newResUser),
          UserRepo.update(user),
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
      call: async ({ params, auth }) => {
        // レス
        const res = await ResRepo.findOne(params.id);

        if (res.type !== "normal") {
          throw new AtPrerequisiteError("通常レス以外は削除出来ません");
        }

        // レスを書き込んだユーザー
        const resUser = await UserRepo.findOne(res.user);

        const { res: newRes, resUser: newResUser } = res.del(resUser, auth.token);

        await Promise.all([
          ResRepo.update(newRes),
          UserRepo.update(newResUser),
        ]);

        return newRes.toAPI(auth.token);
      },
    });
  }
  // [topic]
  {
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
      call: async ({ params, auth, ip, now }) => {
        const user = await UserRepo.findOne(auth.token.user);
        const create = TopicNormal.create(ObjectIDGenerator,
          params.title,
          params.tags,
          params.body,
          user,
          auth.token,
          now);

        await TopicRepo.insert(create.topic);
        await Promise.all([
          UserRepo.update(create.user),
          ResRepo.insert(create.res),
          HistoryRepo.insert(create.history),
        ]);
        appLog("topic/create", ip, "topics", create.topic.id);
        appLog("topic/create", ip, "reses", create.res.id);
        appLog("topic/create", ip, "histories", create.history.id);
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
      call: async ({ params, auth, ip, now }) => {
        const user = await UserRepo.findOne(auth.token.user);
        const create = TopicOne.create(ObjectIDGenerator,
          params.title,
          params.tags,
          params.body,
          user,
          auth.token,
          now);

        await TopicRepo.insert(create.topic);
        await Promise.all([
          UserRepo.update(create.user),
          ResRepo.insert(create.res),
        ]);

        appLog("topic/create", ip, "topics", create.topic.id);
        appLog("topic/create", ip, "reses", create.res.id);

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
      call: async ({ params, auth, ip, now }) => {
        const user = await UserRepo.findOne(auth.token.user);
        const parent = await TopicRepo.findOne(params.parent);

        if (parent.type !== "normal") {
          throw new AtPrerequisiteError("通常トピック以外の派生トピックは作れません");
        }

        const create = TopicFork.create(ObjectIDGenerator,
          params.title,
          parent,
          user,
          auth.token,
          now);

        await TopicRepo.insert(create.topic);
        await TopicRepo.update(create.parent);
        await Promise.all([
          UserRepo.update(create.user),
          ResRepo.insert(create.res),
          ResRepo.insert(create.resParent),
        ]);

        appLog("topic/create", ip, "topics", create.topic.id);
        appLog("topic/create", ip, "reses", create.res.id);
        appLog("topic/create", ip, "reses", create.resParent.id);

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
      call: async ({ params }) => {
        const topic = await TopicRepo.findOne(params.id);
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
      call: async ({ params }) => {
        const topics = await TopicRepo.findIn(params.ids);
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
      call: async ({ params }) => {
        const topic = await TopicRepo
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
      call: async ({ params }) => {
        const parent = await TopicRepo.findOne(params.parent);
        if (parent.type !== "normal") {
          throw new AtPrerequisiteError("親トピックは通常トピックのみ指定できます");
        }

        const topic = await TopicRepo.findFork(parent, params.skip, params.limit, params.activeOnly);
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
      call: async ({ params }) => {
        return await TopicRepo.findTags(params.limit);
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
      call: async ({ params, auth, ip, now }) => {
        const [topic, user] = await Promise.all([
          TopicRepo.findOne(params.id),
          UserRepo.findOne(auth.token.user),
        ]);

        if (topic.type !== "normal") {
          throw new AtPrerequisiteError("通常トピック以外は編集出来ません");
        }

        const val = topic.changeData(ObjectIDGenerator, user, auth.token, params.title, params.tags, params.body, now);

        await Promise.all([
          ResRepo.insert(val.res),
          HistoryRepo.insert(val.history),
          TopicRepo.update(val.topic),
          UserRepo.update(val.user),
        ]);

        appLog("topic/update", ip, "reses", val.res.id);
        appLog("topic/update", ip, "histories", val.history.id);
        return topic.toAPI();
      },
    });
  }
  // [history]
  {
    api.addAPI<{ id: string }, IHistoryAPI>({
      url: "/history/find/one",

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
      call: async ({ params }) => {
        return (await HistoryRepo.findOne(params.id))
          .toAPI();
      },
    });

    api.addAPI<{ ids: string[] }, IHistoryAPI[]>({
      url: "/history/find/in",

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
      call: async ({ params }) => {
        return (await HistoryRepo.findIn(params.ids))
          .map(h => h.toAPI());
      },
    });

    api.addAPI<{ topic: string }, IHistoryAPI[]>({
      url: "/history/find/all",

      isAuthUser: false,
      isAuthToken: "no",
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["topic"],
        properties: {
          topic: {
            type: "string",
          },
        },
      },
      call: async ({ params }) => {
        return (await HistoryRepo.findAll(await TopicRepo.findOne(params.topic)))
          .map(h => h.toAPI());
      },
    });
  }
  // [msg]
  {
    api.addAPI<{ id: string }, IMsgAPI>({
      url: "/msg/find/one",

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
      call: async ({ params, auth }) => {
        const msg = await MsgRepo.findOne(params.id);
        return msg.toAPI(auth.token);
      },
    });

    api.addAPI<{ ids: string[] }, IMsgAPI[]>({
      url: "/msg/find/in",

      isAuthUser: false,
      isAuthToken: "all",
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
      call: async ({ params, auth }) => {
        const msgs = await MsgRepo.findIn(params.ids);
        return msgs.map(m => m.toAPI(auth.token));
      },
    });

    api.addAPI<{
      type: "before" | "after",
      equal: boolean,
      date: string,
      limit: number,
    }, IMsgAPI[]>({
      url: "/msg/find",

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
      call: async ({ params, auth }) => {
        const msgs = await MsgRepo
          .find(auth.token, params.type, params.equal, new Date(params.date), params.limit);
        return msgs.map(m => m.toAPI(auth.token));
      },
    });

    api.addAPI<{ limit: number }, IMsgAPI[]>({
      url: "/msg/find/new",

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
      call: async ({ params, auth }) => {
        const msgs = await MsgRepo.findNew(auth.token, params.limit);
        return msgs.map(m => m.toAPI(auth.token));
      },
    });
  }
  // [profile]
  {
    api.addAPI<{
      name: string,
      body: string,
      sn: string,
    }, IProfileAPI>({
      url: "/profile/create",

      isAuthUser: false,
      isAuthToken: "all",
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["name", "body", "sn"],
        properties: {
          name: {
            type: "string",
          },
          body: {
            type: "string",
          },
          sn: {
            type: "string",
          },
        },
      },
      call: async ({ params, auth, ip, now }) => {
        const profile = Profile.create(ObjectIDGenerator, auth.token, params.name, params.body, params.sn, now);
        await ProfileRepo.insert(profile);
        appLog("profile/create", ip, "profiles", profile.id);
        return profile.toAPI(auth.token);
      },
    });

    api.addAPI<{ id: string }, IProfileAPI>({
      url: "/profile/find/one",

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
      call: async ({ params, auth }) => {
        const profile = await ProfileRepo.findOne(params.id);
        return profile.toAPI(auth.tokenOrNull);
      },
    });

    api.addAPI<{ ids: string[] }, IProfileAPI[]>({
      url: "/profile/find/in",

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
      call: async ({ params, auth }) => {
        const profiles = await ProfileRepo.findIn(params.ids);
        return profiles.map(p => p.toAPI(auth.tokenOrNull));
      },
    });

    api.addAPI<null, IProfileAPI[]>({
      url: "/profile/find/all",

      isAuthUser: false,
      isAuthToken: "all",
      schema: {
        type: "null",
      },
      call: async ({ auth }) => {
        const profiles = await ProfileRepo.findAll(auth.token);
        return profiles.map(p => p.toAPI(auth.token));
      },
    });

    api.addAPI<{
      id: string,
      name: string,
      body: string,
      sn: string,
    }, IProfileAPI>({
      url: "/profile/update",

      isAuthUser: false,
      isAuthToken: "all",
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["id", "name", "body", "sn"],
        properties: {
          id: {
            type: "string",
          },
          name: {
            type: "string",
          },
          body: {
            type: "string",
          },
          sn: {
            type: "string",
          },
        },
      },
      call: async ({ params, auth, ip, now }) => {
        const profile = await ProfileRepo.findOne(params.id);
        const newProfile = profile.changeData(auth.token, params.name, params.body, params.sn, now);
        await ProfileRepo.update(newProfile);
        appLog("profile/update", ip, "profiles", newProfile.id);
        return newProfile.toAPI(auth.token);
      },
    });
  }
  // [token]
  {
    api.addAPI<null, ITokenAPI>({
      url: "/token/find/one",

      isAuthUser: false,
      isAuthToken: "all",
      schema: {
        type: "null",
      },
      call: async ({ auth }) => {
        const token = await TokenRepo.findOne(auth.token.id);
        return token.toAPI();
      },
    });

    api.addAPI<null, ITokenAPI[]>({
      url: "/token/find/all",

      isAuthUser: false,
      isAuthToken: "master",
      schema: {
        type: "null",
      },
      call: async ({ auth }) => {
        const tokens = await TokenRepo.findAll(auth.tokenMaster);
        return tokens.map(t => t.toAPI());
      },
    });

    api.addAPI<{ client: string }, null>({
      url: "/token/client/delete",

      isAuthUser: false,
      isAuthToken: "master",
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["client"],
        properties: {
          client: {
            type: "string",
          },
        },
      },
      call: async ({ params, auth }) => {
        const client = await ClientRepo.findOne(params.client);
        await TokenRepo.delClientToken(auth.tokenMaster, client);
        return null;
      },
    });

    api.addAPI<null, IClientAPI[]>({
      url: "/token/find/client/all",

      isAuthUser: false,
      isAuthToken: "master",
      schema: {
        type: "null",
      },
      call: async ({ auth }) => {
        const clients = await TokenRepo.listClient(auth.tokenMaster);
        return clients.map(c => c.toAPI(auth.tokenMaster));
      },
    });

    api.addAPI<{ client: string }, ITokenGeneralAPI>({
      url: "/token/create/general",

      isAuthUser: false,
      isAuthToken: "master",
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["client"],
        properties: {
          client: {
            type: "string",
          },
        },
      },
      call: async ({ params, auth, now }) => {
        const client = await ClientRepo.findOne(params.client);
        const token = TokenGeneral.create(ObjectIDGenerator, auth.tokenMaster, client, now, RandomGenerator);
        await TokenRepo.insert(token);

        return token.toAPI();
      },
    });

    api.addAPI<null, ITokenMasterAPI>({
      url: "/token/create/master",

      isAuthUser: true,
      isAuthToken: "no",
      schema: {
        type: "null",
      },
      call: async ({ auth, now }) => {
        const token = TokenMaster.create(ObjectIDGenerator, auth.user, now, RandomGenerator);
        await TokenRepo.insert(token);

        return token.toAPI();
      },
    });

    api.addAPI<{ name: string, value: string }, null>({
      url: "/token/storage/set",

      isAuthUser: false,
      isAuthToken: "all",
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["name", "value"],
        properties: {
          name: {
            type: "string",
          },
          value: {
            type: "string",
          },
        },
      },
      call: async ({ params, auth }) => {
        await TokenRepo.setStorage(auth.token, params.name, params.value);
        return null;
      },
    });

    api.addAPI<{ name: string }, string>({
      url: "/token/storage/get",

      isAuthUser: false,
      isAuthToken: "all",
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["name"],
        properties: {
          name: {
            type: "string",
          },
        },
      },
      call: async ({ params, auth }) => {
        return await TokenRepo.getStorage(auth.token, params.name);
      },
    });

    api.addAPI<{ name: string }, null>({
      url: "/token/storage/delete",

      isAuthUser: false,
      isAuthToken: "all",
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["name"],
        properties: {
          name: {
            type: "string",
          },
        },
      },
      call: async ({ params, auth }) => {
        await TokenRepo.deleteStorage(auth.token, params.name);
        return null;
      },
    });

    api.addAPI<null, string[]>({
      url: "/token/storage/list",

      isAuthUser: false,
      isAuthToken: "all",
      schema: {
        type: "null",
      },
      call: async ({ auth }) => {
        return await TokenRepo.listStorage(auth.token);
      },
    });

    api.addAPI<null, ITokenReqAPI>({
      url: "/token/req/create",

      isAuthUser: false,
      isAuthToken: "all",
      schema: {
        type: "null",
      },
      call: async ({ auth, now }) => {
        const token = await TokenRepo.findOne(auth.token.id);
        if (token.type !== "general") {
          throw new AtPrerequisiteError("通常トークン以外では出来ません");
        }
        const { req, token: newToken } = token.createReq(now, RandomGenerator);

        await TokenRepo.update(newToken);

        return req;
      },
    });

    api.addAPI<{ id: string, key: string }, ITokenGeneralAPI>({
      url: "/token/find/req",

      isAuthUser: false,
      isAuthToken: "no",
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["id", "key"],
        properties: {
          id: {
            type: "string",
          },
          key: {
            type: "string",
          },
        },
      },
      call: async ({ params, now }) => {
        const token = await TokenRepo.findOne(params.id);
        if (token.type !== "general") {
          throw new AtPrerequisiteError("通常トークン以外では出来ません");
        }
        token.authReq(params.key, now);
        return token.toAPI();
      },
    });
  }
  // [user]
  {
    api.addAPI<{
      sn: string,
      pass: string,
    }, IUserAPI>({
      url: "/user/create",

      isAuthUser: false,
      isAuthToken: "no",
      isRecaptcha: true,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["sn", "pass"],
        properties: {
          sn: {
            type: "string",
          },
          pass: {
            type: "string",
          },
        },
      },
      call: async ({ params, now }) => {
        const user = User.create(ObjectIDGenerator, params.sn, params.pass, now);
        await UserRepo.insert(user);
        return user.toAPI();
      },
    });
    api.addAPI<{ sn: string }, string>({
      url: "/user/find/id",

      isAuthUser: false,
      isAuthToken: "no",
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["sn"],
        properties: {
          sn: {
            type: "string",
          },
        },
      },
      call: async ({ params }) => {
        return (await UserRepo.findID(params.sn)).toString();
      },
    });
    api.addAPI<{ id: string }, string>({
      url: "/user/find/sn",

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
      call: async ({ params }) => {
        return (await UserRepo.findSN(params.id));
      },
    });
    api.addAPI<{ pass: string, sn: string }, IUserAPI>({
      url: "/user/update",

      isAuthUser: true,
      isAuthToken: "no",
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["pass", "sn"],
        properties: {
          pass: {
            type: "string",
          },
          sn: {
            type: "string",
          },
        },
      },
      call: async ({ params, auth }) => {
        const user = await UserRepo.findOne(auth.user.id);
        const newUser = user.change(auth.user, params.pass, params.sn);
        await UserRepo.update(newUser);
        await TokenRepo.delMasterToken(auth.user);
        return newUser.toAPI();
      },
    });
  }
  // [client]
  {
    api.addAPI<{ name: string, url: string }, IClientAPI>({
      url: "/client/create",

      isAuthUser: false,
      isAuthToken: "master",
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["name", "url"],
        properties: {
          name: {
            type: "string",
          },
          url: {
            type: "string",
          },
        },
      },
      call: async ({ params, auth, ip, now }) => {
        const client = Client.create(ObjectIDGenerator, auth.tokenMaster, params.name, params.url, now);
        await ClientRepo.insert(client);
        appLog("client/create", ip, "clients", client.id);
        return client.toAPI(auth.tokenMaster);
      },
    });

    api.addAPI<{
      id: string,
      name: string,
      url: string,
    }, IClientAPI>({
      url: "/client/update",

      isAuthUser: false,
      isAuthToken: "master",
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["id", "name", "url"],
        properties: {
          id: {
            type: "string",
          },
          name: {
            type: "string",
          },
          url: {
            type: "string",
          },
        },
      },
      call: async ({ params, auth, ip, now }) => {
        const client = await ClientRepo.findOne(params.id);
        const newClient = client.changeData(auth.tokenMaster, params.name, params.url, now);
        await ClientRepo.update(newClient);
        appLog("client/update", ip, "clients", newClient.id);
        return newClient.toAPI(auth.tokenMaster);
      },
    });

    api.addAPI<{ id: string }, IClientAPI>({
      url: "/client/find/one",

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
      call: async ({ params, auth }) => {
        const client = await ClientRepo.findOne(params.id);
        return client.toAPI(auth.TokenMasterOrNull);
      },
    });

    api.addAPI<{ ids: string[] }, IClientAPI[]>({
      url: "/client/find/in",

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
      call: async ({ params, auth }) => {
        const clients = await ClientRepo.findIn(params.ids);
        return clients.map(c => c.toAPI(auth.TokenMasterOrNull));
      },
    });

    api.addAPI<null, IClientAPI[]>({
      url: "/client/find/all",

      isAuthUser: false,
      isAuthToken: "master",
      schema: {
        type: "null",
      },
      call: async ({ auth }) => {
        const clients = await ClientRepo.findAll(auth.tokenMaster);
        return clients.map(c => c.toAPI(auth.tokenMaster));
      },
    });
  }

  api.addAPI<null, null>({
    url: "/user/auth",

    isAuthUser: true,
    isAuthToken: "no",
    schema: {
      type: "null",
    },
    call: async () => {
      return null;
    },
  });

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
    call: async ({ auth, params }) => {
      const topic = await TopicRepo.findOne(params.id);
      return ResRepo
        .insertEvent
        .asObservable()
        .filter(x => x.res.topic === topic.id)
        .map(x => ({ ...x, res: x.res.toAPI(auth.tokenOrNull) }));
    },
  });

  api.run();

  // cron
  UserRepo.cron();
  TopicRepo.cron();
})();
