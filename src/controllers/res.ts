import { AtPrerequisiteError } from "../at-error";
import { ObjectIDGenerator } from "../generator";
import {
  ResNormal,
  Res,
  IRepo
} from "../models";
import {
  Context,
  DateType,
} from "../server";
import { withFilter } from "apollo-server";
import { pubsub, RES_ADDED } from "../server/pubsub";

export const resResolver = (repo: IRepo) => {
  repo.res.insertEvent.subscribe(data => {
    pubsub.publish(RES_ADDED, data);
  });

  return {
    Query: {
      reses: async (_obj: any,
        args: {
          id: string[] | null,
          topic: string | null,
          notice: boolean | null,
          hash: string | null,
          reply: string | null,
          profile: string | null,
          self: boolean | null,
          text: string | null,
          date: DateType | null,
          limit: number,
        }, context: Context,
        _info: any) => {
        const reses = await repo.res.find2(context.auth, {
          id: args.id,
          topic: args.topic,
          notice: args.notice,
          hash: args.hash,
          reply: args.reply,
          profile: args.profile,
          self: args.self,
          text: args.text,
          date: args.date,
        }, args.limit);
        return reses.map(x => x.toAPI(context.auth.tokenOrNull));
      },
    },
    Mutation: {
      createRes: async (_obj: any,
        args: {
          topic: string,
          name: string | null,
          text: string,
          reply: string | null,
          profile: string | null,
          age: boolean,
        }, context: Context,
        _info: any) => {
        const [topic, user, reply, profile] = await Promise.all([
          repo.topic.findOne(args.topic),
          repo.user.findOne(context.auth.token.user),
          args.reply !== null ? repo.res.findOne(args.reply) : Promise.resolve(null),
          args.profile !== null ? repo.profile.findOne(args.profile) : Promise.resolve(null),
        ]);

        const { res, user: newUser, topic: newTopic } = ResNormal.create(ObjectIDGenerator,
          topic,
          user,
          context.auth.token,
          args.name,
          args.text,
          reply,
          profile,
          args.age,
          context.now);

        await Promise.all([
          repo.res.insert(res),
          repo.topic.update(newTopic),
          repo.user.update(newUser),
        ]);

        context.log("reses", res.id);
        return res.toAPI(context.auth.token);
      },
      voteRes: async (_obj: any,
        args: {
          id: string,
          vote: "uv" | "dv" | "cv"
        }, context: Context,
        _info: any) => {
        if (args.vote === "cv") {
          const [res, user] = await Promise.all([
            repo.res.findOne(args.id),
            repo.user.findOne(context.auth.token.user),
          ]);

          // レスを書き込んだユーザー
          const resUser = await repo.user.findOne(res.user);

          const { res: newRes, resUser: newResUser } = res.cv(resUser, user, context.auth.token);

          await Promise.all([
            repo.res.update(newRes),
            repo.user.update(newResUser),
            repo.user.update(user),
          ]);

          return newRes.toAPI(context.auth.token);
        } else {
          const [res, user] = await Promise.all([
            repo.res.findOne(args.id),
            repo.user.findOne(context.auth.token.user),
          ]);

          // レスを書き込んだユーザー
          const resUser = await repo.user.findOne(res.user);

          const { res: newRes, resUser: newResUser } = res.v(resUser, user, args.vote, context.auth.token);

          await Promise.all([
            repo.res.update(newRes),
            repo.user.update(newResUser),
            repo.user.update(user),
          ]);

          return newRes.toAPI(context.auth.token);
        }
      },
      delRes: async (_obj: any,
        args: {
          id: string,
        }, context: Context,
        _info: any) => {
        const res = await repo.res.findOne(args.id);

        if (res.type !== "normal") {
          throw new AtPrerequisiteError("通常レス以外は削除出来ません");
        }

        // レスを書き込んだユーザー
        const resUser = await repo.user.findOne(res.user);

        const { res: newRes, resUser: newResUser } = res.del(resUser, context.auth.token);

        await Promise.all([
          repo.res.update(newRes),
          repo.user.update(newResUser),
        ]);

        return newRes.toAPI(context.auth.token);
      }
    },
    Subscription: {
      resAdded: {
        resolve: (payload: { res: Res, count: number }, _args: any, context: Context, _info: any) => {
          return { ...payload, res: payload.res.toAPI(context.auth.tokenOrNull) };
        },
        subscribe: () => withFilter(
          () => pubsub.asyncIterator(RES_ADDED),
          (payload: { res: Res, count: number }, args: { topic: string }) => {
            return payload.res.topic === args.topic;
          },
        ),
      },
    },
  };
};