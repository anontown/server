import { AppServer } from "../server";
import { ObjectIDGenerator } from "../generator";
import {
  IProfileAPI,
  Profile,
} from "../models";

export function addProfileAPI(api: AppServer) {
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
    call: async ({ params, auth, log, now, repo }) => {
      const profile = Profile.create(ObjectIDGenerator, auth.token, params.name, params.body, params.sn, now);
      await repo.profile.insert(profile);
      log("profiles", profile.id);
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
    call: async ({ params, auth, repo }) => {
      const profile = await repo.profile.findOne(params.id);
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
    call: async ({ params, auth, repo }) => {
      const profiles = await repo.profile.findIn(params.ids);
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
    call: async ({ auth, repo }) => {
      const profiles = await repo.profile.findAll(auth.token);
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
    call: async ({ params, auth, log, now, repo }) => {
      const profile = await repo.profile.findOne(params.id);
      const newProfile = profile.changeData(auth.token, params.name, params.body, params.sn, now);
      await repo.profile.update(newProfile);
      log("profiles", newProfile.id);
      return newProfile.toAPI(auth.token);
    },
  });

}