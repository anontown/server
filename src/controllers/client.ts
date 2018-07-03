import { ObjectIDGenerator } from "../generator";
import {
  Client,
  IClientAPI,
} from "../models";
import {
  controller,
  http,
  IHttpAPICallParams,
} from "../server";
import { Context, DateType } from "../server";

export const clientResolver = {
  Query: {
    clients: async (_obj: any,
      args: {
        id: string[] | null,
        self: boolean | null,
      }, context: Context,
      _info: any) => {
      const clients = await context.repo.client.find(context.auth.TokenMasterOrNull, {
        id: args.id,
        self: args.self
      });
      return clients.map(c => c.toAPI(context.auth.TokenMasterOrNull));
    }
  },
  Mutation: {

  },
};

@controller
export class ClientController {
  @http({
    url: "/client/create",

    isAuthUser: false,
    isAuthToken: "master",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["name", "url"],
      properties: {
        name: {
          type: "string",
        },
        url: {
          type: "string",
        },
      },
    },
  })
  async create({ params, auth, log, now, repo }: IHttpAPICallParams<{ name: string, url: string }>)
    : Promise<IClientAPI> {
    const client = Client.create(ObjectIDGenerator, auth.tokenMaster, params.name, params.url, now);
    await repo.client.insert(client);
    log("clients", client.id);
    return client.toAPI(auth.tokenMaster);
  }

  @http({
    url: "/client/update",

    isAuthUser: false,
    isAuthToken: "master",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["id", "name", "url"],
      properties: {
        id: {
          type: "string",
        },
        name: {
          type: "string",
        },
        url: {
          type: "string",
        },
      },
    },
  })
  async update({ params, auth, log, now, repo }: IHttpAPICallParams<{
    id: string,
    name: string,
    url: string,
  }>): Promise<IClientAPI> {
    const client = await repo.client.findOne(params.id);
    const newClient = client.changeData(auth.tokenMaster, params.name, params.url, now);
    await repo.client.update(newClient);
    log("clients", newClient.id);
    return newClient.toAPI(auth.tokenMaster);
  }

  @http({
    url: "/client/find/one",

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
  async findOne({ params, auth, repo }: IHttpAPICallParams<{ id: string }>): Promise<IClientAPI> {
    const client = await repo.client.findOne(params.id);
    return client.toAPI(auth.TokenMasterOrNull);
  }

  @http({
    url: "/client/find/in",

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
  async findIn({ params, auth, repo }: IHttpAPICallParams<{ ids: string[] }>): Promise<IClientAPI[]> {
    const clients = await repo.client.findIn(params.ids);
    return clients.map(c => c.toAPI(auth.TokenMasterOrNull));
  }

  @http({
    url: "/client/find/all",

    isAuthUser: false,
    isAuthToken: "master",
    schema: {
      type: "null",
    },
  })
  async findAll({ auth, repo }: IHttpAPICallParams<null>): Promise<IClientAPI[]> {
    const clients = await repo.client.findAll(auth.tokenMaster);
    return clients.map(c => c.toAPI(auth.tokenMaster));
  }
}
