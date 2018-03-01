import { AppServer } from "../server";
import { AtPrerequisiteError } from "../at-error";
import { ObjectIDGenerator, RandomGenerator } from "../generator";
import {
  IClientAPI,
  ITokenAPI,
  ITokenGeneralAPI,
  ITokenMasterAPI,
  ITokenReqAPI,
  TokenGeneral,
  TokenMaster,
} from "../models";

export function addTokenAPI(api: AppServer) {
  api.addAPI<null, ITokenAPI>({
    url: "/token/find/one",

    isAuthUser: false,
    isAuthToken: "all",
    schema: {
      type: "null",
    },
    call: async ({ auth, repo }) => {
      const token = await repo.token.findOne(auth.token.id);
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
    call: async ({ auth, repo }) => {
      const tokens = await repo.token.findAll(auth.tokenMaster);
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
    call: async ({ params, auth, repo }) => {
      const client = await repo.client.findOne(params.client);
      await repo.token.delClientToken(auth.tokenMaster, client);
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
    call: async ({ auth, repo }) => {
      const clients = await repo.token.listClient(auth.tokenMaster);
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
    call: async ({ params, auth, now, repo }) => {
      const client = await repo.client.findOne(params.client);
      const token = TokenGeneral.create(ObjectIDGenerator, auth.tokenMaster, client, now, RandomGenerator);
      await repo.token.insert(token);

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
    call: async ({ auth, now, repo }) => {
      const token = TokenMaster.create(ObjectIDGenerator, auth.user, now, RandomGenerator);
      await repo.token.insert(token);

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
    call: async ({ params, auth, repo }) => {
      await repo.token.setStorage(auth.token, params.name, params.value);
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
    call: async ({ params, auth, repo }) => {
      return await repo.token.getStorage(auth.token, params.name);
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
    call: async ({ params, auth, repo }) => {
      await repo.token.deleteStorage(auth.token, params.name);
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
    call: async ({ auth, repo }) => {
      return await repo.token.listStorage(auth.token);
    },
  });

  api.addAPI<null, ITokenReqAPI>({
    url: "/token/req/create",

    isAuthUser: false,
    isAuthToken: "all",
    schema: {
      type: "null",
    },
    call: async ({ auth, now, repo }) => {
      const token = await repo.token.findOne(auth.token.id);
      if (token.type !== "general") {
        throw new AtPrerequisiteError("通常トークン以外では出来ません");
      }
      const { req, token: newToken } = token.createReq(now, RandomGenerator);

      await repo.token.update(newToken);

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
    call: async ({ params, now, repo }) => {
      const token = await repo.token.findOne(params.id);
      if (token.type !== "general") {
        throw new AtPrerequisiteError("通常トークン以外では出来ません");
      }
      token.authReq(params.key, now);
      return token.toAPI();
    },
  });
}