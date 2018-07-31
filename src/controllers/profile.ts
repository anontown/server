import { ObjectIDGenerator } from "../generator";
import {
  IRepo,
  Profile,
} from "../models";
import {
  Context,
} from "../server";

export const profileResolver = (repo: IRepo) => {
  return {
    Query: {
      profiles: async (
        _obj: any,
        args: {
          id?: string[],
          self?: boolean,
        },
        context: Context,
        _info: any) => {
        const profiles = await repo.profile.find(context.auth, { id: args.id, self: args.self });
        return profiles.map(p => p.toAPI(context.auth.tokenOrNull));
      },
    },
    Mutation: {
      createProfile: async (
        _obj: any,
        args: {
          name: string,
          text: string,
          sn: string,
        },
        context: Context,
        _info: any) => {
        const profile = Profile.create(ObjectIDGenerator,
          context.auth.token,
          args.name,
          args.text,
          args.sn,
          context.now);
        await repo.profile.insert(profile);
        context.log("profiles", profile.id);
        return profile.toAPI(context.auth.token);
      },
      updateProfile: async (
        _obj: any,
        args: {
          id: string,
          name: string,
          text: string,
          sn: string,
        },
        context: Context,
        _info: any) => {
        const profile = await repo.profile.findOne(args.id);
        const newProfile = profile.changeData(context.auth.token, args.name, args.text, args.sn, context.now);
        await repo.profile.update(newProfile);
        context.log("profiles", newProfile.id);
        return newProfile.toAPI(context.auth.token);
      },
    },
  };
};
