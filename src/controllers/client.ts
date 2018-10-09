import { ObjectIDGenerator } from "../generator";
import {
  Client,
  ClientQuery,
  IRepo,
} from "../models";
import { Context } from "../server";

export const clientResolver = (repo: IRepo) => {
  return {
    Query: {
      clients: async (
        _obj: any,
        args: {
          query: ClientQuery,
        },
        context: Context,
        _info: any) => {
        const clients = await repo.client.find(context.auth.TokenMasterOrNull, args.query);
        return clients.map(c => c.toAPI(context.auth.TokenMasterOrNull));
      },
    },
    Mutation: {
      createClient: async (
        _obj: any,
        args: {
          name: string,
          url: string,
        },
        context: Context,
        _info: any) => {
        const client = Client.create(ObjectIDGenerator, context.auth.tokenMaster, args.name, args.url, context.now);
        await repo.client.insert(client);
        context.log("clients", client.id);
        return client.toAPI(context.auth.tokenMaster);
      },
      updateClient: async (
        _obj: any,
        args: {
          id: string,
          name?: string,
          url?: string,
        },
        context: Context,
        _info: any) => {
        const client = await repo.client.findOne(args.id);
        const newClient = client.changeData(context.auth.tokenMaster, args.name, args.url, context.now);
        await repo.client.update(newClient);
        context.log("clients", newClient.id);
        return newClient.toAPI(context.auth.tokenMaster);
      },
    },
  };
};
