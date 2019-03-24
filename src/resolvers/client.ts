import { some } from "fp-ts/lib/Option";
import { ObjectIDGenerator } from "../generator";
import {
  Client,
  IClientAPI,
  IRepo,
} from "../models";
import { AppContext } from "../server";
import * as G from "../generated/graphql";
import { nullToUndefined } from "@kgtkr/utils";

export const clientResolver = {
  Query: {
    clients: async (
      _obj: any,
      args: G.QueryClientsArgs,
      context: AppContext,
      _info: any): Promise<IClientAPI[]> => {
      const clients = await context.repo.client.find(context.auth.TokenMasterOrNull, args.query);
      return clients.map(c => c.toAPI(context.auth.TokenMasterOrNull));
    },
  },
  Mutation: {
    createClient: async (
      _obj: any,
      args: G.MutationCreateClientArgs,
      context: AppContext,
      _info: any): Promise<IClientAPI> => {
      const client = Client.create(ObjectIDGenerator, context.auth.tokenMaster, args.name, args.url, context.now);
      await context.repo.client.insert(client);
      context.log("clients", client.id);
      return client.toAPI(some(context.auth.tokenMaster));
    },
    updateClient: async (
      _obj: any,
      args: G.MutationUpdateClientArgs,
      context: AppContext,
      _info: any): Promise<IClientAPI> => {
      const client = await context.repo.client.findOne(args.id);
      const newClient = client.changeData(context.auth.tokenMaster, nullToUndefined(args.name), nullToUndefined(args.url), context.now);
      await context.repo.client.update(newClient);
      context.log("clients", newClient.id);
      return newClient.toAPI(some(context.auth.tokenMaster));
    },
  },
};