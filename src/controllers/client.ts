import { ObjectIDGenerator } from "../generator";
import {
  Client,
  IClientAPI,
} from "../models";
import { AppServer } from "../server";

export function addClientAPI(api: AppServer) {
  api.addAPI<{ name: string, url: string }, IClientAPI>({
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
    call: async ({ params, auth, log, now, repo }) => {
      const client = Client.create(ObjectIDGenerator, auth.tokenMaster, params.name, params.url, now);
      await repo.client.insert(client);
      log("clients", client.id);
      return client.toAPI(auth.tokenMaster);
    },
  });

  api.addAPI<{
    id: string,
    name: string,
    url: string,
  }, IClientAPI>({
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
    call: async ({ params, auth, log, now, repo }) => {
      const client = await repo.client.findOne(params.id);
      const newClient = client.changeData(auth.tokenMaster, params.name, params.url, now);
      await repo.client.update(newClient);
      log("clients", newClient.id);
      return newClient.toAPI(auth.tokenMaster);
    },
  });

  api.addAPI<{ id: string }, IClientAPI>({
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
    call: async ({ params, auth, repo }) => {
      const client = await repo.client.findOne(params.id);
      return client.toAPI(auth.TokenMasterOrNull);
    },
  });

  api.addAPI<{ ids: string[] }, IClientAPI[]>({
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
    call: async ({ params, auth, repo }) => {
      const clients = await repo.client.findIn(params.ids);
      return clients.map(c => c.toAPI(auth.TokenMasterOrNull));
    },
  });

  api.addAPI<null, IClientAPI[]>({
    url: "/client/find/all",

    isAuthUser: false,
    isAuthToken: "master",
    schema: {
      type: "null",
    },
    call: async ({ auth, repo }) => {
      const clients = await repo.client.findAll(auth.tokenMaster);
      return clients.map(c => c.toAPI(auth.tokenMaster));
    },
  });
}
