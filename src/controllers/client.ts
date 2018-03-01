import { ObjectIDGenerator } from "../generator";
import {
  Client,
  IClientAPI,
} from "../models";
import {
  controller,
  http,
  IHttpAPICallParams
} from "../server";

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
    }
  })
  async createClient({ params, auth, log, now, repo }: IHttpAPICallParams<{ name: string, url: string }>): Promise<IClientAPI> {
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
  async updateClient({ params, auth, log, now, repo }: IHttpAPICallParams<{
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
  async findClientOne({ params, auth, repo }: IHttpAPICallParams<{ id: string }>): Promise<IClientAPI> {
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
  async findClientIn({ params, auth, repo }: IHttpAPICallParams<{ ids: string[] }>): Promise<IClientAPI[]> {
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
  async findClientAll({ auth, repo }: IHttpAPICallParams<null>): Promise<IClientAPI[]> {
    const clients = await repo.client.findAll(auth.tokenMaster);
    return clients.map(c => c.toAPI(auth.tokenMaster));
  }
}