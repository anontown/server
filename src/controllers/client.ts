import { some } from "fp-ts/lib/Option";
import { ObjectIDGenerator } from "../generator";
import {
  Client,
  IClientAPI,
  IRepo,
} from "../models";
import { Context } from "../server";
import * as G from "../generated/graphql";
import { nullToUndefined } from "../utils/index";

export const clientResolver = (repo: IRepo) => {
  return {
    Query: {
      clients: async (
        _obj: any,
        args: G.QueryClientsArgs,
        context: Context,
        _info: any): Promise<IClientAPI[]> => {
        const clients = await repo.client.find(context.auth.TokenMasterOrNull, args.query);
        return clients.map(c => c.toAPI(context.auth.TokenMasterOrNull));
      },
    },
    Mutation: {
      createClient: async (
        _obj: any,
        args: G.MutationCreateClientArgs,
        context: Context,
        _info: any): Promise<IClientAPI> => {
        const client = Client.create(ObjectIDGenerator, context.auth.tokenMaster, args.name, args.url, context.now);
        await repo.client.insert(client);
        context.log("clients", client.id);
        return client.toAPI(some(context.auth.tokenMaster));
      },
      updateClient: async (
        _obj: any,
        args: G.MutationUpdateClientArgs,
        context: Context,
        _info: any): Promise<IClientAPI> => {
        const client = await repo.client.findOne(args.id);
        const newClient = client.changeData(context.auth.tokenMaster, nullToUndefined(args.name), nullToUndefined(args.url), context.now);
        await repo.client.update(newClient);
        context.log("clients", newClient.id);
        return newClient.toAPI(some(context.auth.tokenMaster));
      },
    },
  };
};
