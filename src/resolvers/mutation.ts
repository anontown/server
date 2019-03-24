import * as G from "../generated/graphql";
import * as authFromApiParam from "../server/auth-from-api-param";
import { ObjectIDGenerator, RandomGenerator } from "../generator";
import {
  User,
  TokenMaster,
  Client,
  Profile,
  ResNormal,
  Storage,
  TokenGeneral,
  TopicNormal,
  TopicOne,
  TopicFork,
} from "../models";
import { nullToUndefined, isNullish } from "@kgtkr/utils";
import { some, fromNullable } from "fp-ts/lib/Option";
import { AtNotFoundError } from "../at-error";

export const mutation: G.MutationResolvers = {
  createUser: async (
    _obj,
    args,
    context,
    _info) => {
    await authFromApiParam.recaptcha(args.recaptcha);

    const user = User.create(ObjectIDGenerator, args.sn, args.pass, context.now);
    await context.repo.user.insert(user);

    const token = TokenMaster.create(ObjectIDGenerator, user.auth(args.pass), context.now, RandomGenerator);
    await context.repo.token.insert(token);

    return { user: user.toAPI(), token: token.toAPI() };
  },
  updateUser: async (
    _obj,
    args,
    context,
    _info) => {
    const authUser = await authFromApiParam.user(context.repo.user, args.auth);
    const user = await context.repo.user.findOne(authUser.id);
    const newUser = user.change(authUser, nullToUndefined(args.pass), nullToUndefined(args.sn));
    await context.repo.user.update(newUser);
    await context.repo.token.delMasterToken(authUser);

    const token = TokenMaster.create(ObjectIDGenerator, authUser, context.now, RandomGenerator);
    await context.repo.token.insert(token);
    return { user: newUser.toAPI(), token: token.toAPI() };
  },
  createClient: async (
    _obj,
    args,
    context,
    _info) => {
    const client = Client.create(ObjectIDGenerator, context.auth.tokenMaster, args.name, args.url, context.now);
    await context.repo.client.insert(client);
    context.log("clients", client.id);
    return client.toAPI(some(context.auth.tokenMaster));
  },
  updateClient: async (
    _obj,
    args,
    context,
    _info) => {
    const client = await context.repo.client.findOne(args.id);
    const newClient = client.changeData(context.auth.tokenMaster, nullToUndefined(args.name), nullToUndefined(args.url), context.now);
    await context.repo.client.update(newClient);
    context.log("clients", newClient.id);
    return newClient.toAPI(some(context.auth.tokenMaster));
  },
  createProfile: async (
    _obj,
    args,
    context,
    _info) => {
    const profile = Profile.create(ObjectIDGenerator,
      context.auth.token,
      args.name,
      args.text,
      args.sn,
      context.now);
    await context.repo.profile.insert(profile);
    context.log("profiles", profile.id);
    return profile.toAPI(some(context.auth.token));
  },
  updateProfile: async (
    _obj,
    args,
    context,
    _info: any) => {
    const profile = await context.repo.profile.findOne(args.id);
    const newProfile = profile.changeData(context.auth.token, nullToUndefined(args.name), nullToUndefined(args.text), nullToUndefined(args.sn), context.now);
    await context.repo.profile.update(newProfile);
    context.log("profiles", newProfile.id);
    return newProfile.toAPI(some(context.auth.token));
  },
  createRes: async (
    _obj,
    args,
    context,
    _info) => {
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
    _obj,
    args,
    context,
    _info) => {
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
    _obj,
    args,
    context,
    _info) => {
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
  setStorage: async (
    _obj,
    args,
    context,
    _info) => {
    const storage = Storage.create(context.auth.token, args.key, args.value);
    await context.repo.storage.save(storage);
    return storage.toAPI(context.auth.token);
  },
  delStorage: async (
    _obj,
    args,
    context,
    _info) => {
    const storage = await context.repo.storage.findOneKey(context.auth.token, args.key);
    await context.repo.storage.del(storage);
    return null;
  },
  delTokenClient: async (
    _obj,
    args,
    context,
    _info) => {
    const client = await context.repo.client.findOne(args.client);
    await context.repo.token.delClientToken(context.auth.tokenMaster, client.id);
    return null;
  },
  createTokenGeneral: async (
    _obj,
    args,
    context,
    _info) => {
    const client = await context.repo.client.findOne(args.client);
    const token = TokenGeneral.create(ObjectIDGenerator,
      context.auth.tokenMaster,
      client,
      context.now,
      RandomGenerator);

    const { req, token: newToken } = token.createReq(context.now, RandomGenerator);

    await context.repo.token.insert(newToken);

    return {
      token: token.toAPI(),
      req
    };
  },
  createTokenMaster: async (
    _obj,
    args,
    context,
    _info) => {
    const authUser = await authFromApiParam.user(context.repo.user, args.auth);
    const token = TokenMaster.create(ObjectIDGenerator, authUser, context.now, RandomGenerator);
    await context.repo.token.insert(token);

    return token.toAPI();
  },
  authTokenReq: async (
    _obj,
    args,
    context,
    _info) => {
    const token = await context.repo.token.findOne(args.id);
    if (token.type !== "general") {
      throw new AtNotFoundError("トークンが見つかりません");
    }
    token.authReq(args.key, context.now);
    return token.toAPI();
  },
  createTokenReq: async (
    _obj,
    _args,
    context,
    _info) => {
    const token = await context.repo.token.findOne(context.auth.token.id);
    if (token.type !== "general") {
      throw new AtNotFoundError("トークンが見つかりません");
    }
    const { req, token: newToken } = token.createReq(context.now, RandomGenerator);

    await context.repo.token.update(newToken);

    return req;
  },
  createTopicNormal: async (
    _obj,
    args,
    context,
    _info) => {
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
    _obj,
    args,
    context,
    _info) => {
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
    _obj,
    args,
    context,
    _info) => {
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
    _obj,
    args,
    context,
    _info) => {
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
};