import { ObjectIDGenerator } from "../generator";
import {
  IProfileAPI,
  Profile,
} from "../models";
import {
  controller,
  http,
  IHttpAPICallParams,
  Context,
} from "../server";

export const profileResolver = {
  Query: {
    profiles: async (_obj: any,
      args: {
        id: string[] | null,
        self: boolean | null,
      }, context: Context,
      _info: any) => {
      const profiles = await context.repo.profile.find(context.auth, { id: args.id, self: args.self });
      return profiles.map(p => p.toAPI(context.auth.tokenOrNull));
    },
  },
  Mutation: {
    createProfile: async (_obj: any,
      args: {
        name: string,
        text: string,
        sn: string
      }, context: Context,
      _info: any) => {
      const profile = Profile.create(ObjectIDGenerator, context.auth.token, args.name, args.text, args.sn, context.now);
      await context.repo.profile.insert(profile);
      context.log("profiles", profile.id);
      return profile.toAPI(context.auth.token);
    },
    updateProfile: async (_obj: any,
      args: {
        id: string,
        name: string,
        text: string,
        sn: string
      }, context: Context,
      _info: any) => {
      const profile = await context.repo.profile.findOne(args.id);
      const newProfile = profile.changeData(context.auth.token, args.name, args.text, args.sn, context.now);
      await context.repo.profile.update(newProfile);
      context.log("profiles", newProfile.id);
      return newProfile.toAPI(context.auth.token);
    },
  },
};

@controller
export class ProfileController {
  @http({
    url: "/profile/create",

    isAuthUser: false,
    isAuthToken: "all",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["name", "text", "sn"],
      properties: {
        name: {
          type: "string",
        },
        text: {
          type: "string",
        },
        sn: {
          type: "string",
        },
      },
    },
  })
  async create({ params, auth, log, now, repo }: IHttpAPICallParams<{
    name: string,
    text: string,
    sn: string,
  }>): Promise<IProfileAPI> {
    const profile = Profile.create(ObjectIDGenerator, auth.token, params.name, params.text, params.sn, now);
    await repo.profile.insert(profile);
    log("profiles", profile.id);
    return profile.toAPI(auth.token);
  }

  @http({
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
  })
  async findOne({ params, auth, repo }: IHttpAPICallParams<{ id: string }>): Promise<IProfileAPI> {
    const profile = await repo.profile.findOne(params.id);
    return profile.toAPI(auth.tokenOrNull);
  }

  @http({
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
  })
  async findIn({ params, auth, repo }: IHttpAPICallParams<{ ids: string[] }>): Promise<IProfileAPI[]> {
    const profiles = await repo.profile.findIn(params.ids);
    return profiles.map(p => p.toAPI(auth.tokenOrNull));
  }

  @http({
    url: "/profile/find/all",

    isAuthUser: false,
    isAuthToken: "all",
    schema: {
      type: "null",
    },
  })
  async findAll({ auth, repo }: IHttpAPICallParams<null>): Promise<IProfileAPI[]> {
    const profiles = await repo.profile.findAll(auth.token);
    return profiles.map(p => p.toAPI(auth.token));
  }

  @http({
    url: "/profile/update",

    isAuthUser: false,
    isAuthToken: "all",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["id", "name", "text", "sn"],
      properties: {
        id: {
          type: "string",
        },
        name: {
          type: "string",
        },
        text: {
          type: "string",
        },
        sn: {
          type: "string",
        },
      },
    },
  })
  async update({ params, auth, log, now, repo }: IHttpAPICallParams<{
    id: string,
    name: string,
    text: string,
    sn: string,
  }>): Promise<IProfileAPI> {
    const profile = await repo.profile.findOne(params.id);
    const newProfile = profile.changeData(auth.token, params.name, params.text, params.sn, now);
    await repo.profile.update(newProfile);
    log("profiles", newProfile.id);
    return newProfile.toAPI(auth.token);
  }
}
