import { AppServer } from "../server";
import { ObjectIDGenerator } from "../generator";
import {
  IUserAPI,
  User,
} from "../models";

export function addUserAPI(api: AppServer) {
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
    call: async ({ params, now, repo }) => {
      const user = User.create(ObjectIDGenerator, params.sn, params.pass, now);
      await repo.user.insert(user);
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
    call: async ({ params, repo }) => {
      return (await repo.user.findID(params.sn)).toString();
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
    call: async ({ params, repo }) => {
      return (await repo.user.findSN(params.id));
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
    call: async ({ params, auth, repo }) => {
      const user = await repo.user.findOne(auth.user.id);
      const newUser = user.change(auth.user, params.pass, params.sn);
      await repo.user.update(newUser);
      await repo.token.delMasterToken(auth.user);
      return newUser.toAPI();
    },
  });
}