import { some } from "fp-ts/lib/Option";
import { ObjectIDGenerator } from "../generator";
import {
  IProfileAPI,
  IRepo,
  Profile,
  ProfileQuery,
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
          query: ProfileQuery,
        },
        context: Context,
        _info: any): Promise<IProfileAPI[]> => {
        const profiles = await repo.profile.find(context.auth, args.query);
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
        _info: any): Promise<IProfileAPI> => {
        const profile = Profile.create(ObjectIDGenerator,
          context.auth.token,
          args.name,
          args.text,
          args.sn,
          context.now);
        await repo.profile.insert(profile);
        context.log("profiles", profile.id);
        return profile.toAPI(some(context.auth.token));
      },
      updateProfile: async (
        _obj: any,
        args: {
          id: string,
          name?: string,
          text?: string,
          sn?: string,
        },
        context: Context,
        _info: any): Promise<IProfileAPI> => {
        const profile = await repo.profile.findOne(args.id);
        const newProfile = profile.changeData(context.auth.token, args.name, args.text, args.sn, context.now);
        await repo.profile.update(newProfile);
        context.log("profiles", newProfile.id);
        return newProfile.toAPI(some(context.auth.token));
      },
    },
  };
};
