import { AppServer } from "../server";
import { } from "../generator";
import {
  IHistoryAPI,
} from "../models";

export function addHistoryAPI(api: AppServer) {
  api.addAPI<{ id: string }, IHistoryAPI>({
    url: "/history/find/one",

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
    call: async ({ params, repo }) => {
      return (await repo.history.findOne(params.id))
        .toAPI();
    },
  });

  api.addAPI<{ ids: string[] }, IHistoryAPI[]>({
    url: "/history/find/in",

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
    call: async ({ params, repo }) => {
      return (await repo.history.findIn(params.ids))
        .map(h => h.toAPI());
    },
  });

  api.addAPI<{ topic: string }, IHistoryAPI[]>({
    url: "/history/find/all",

    isAuthUser: false,
    isAuthToken: "no",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["topic"],
      properties: {
        topic: {
          type: "string",
        },
      },
    },
    call: async ({ params, repo }) => {
      return (await repo.history.findAll(await repo.topic.findOne(params.topic)))
        .map(h => h.toAPI());
    },
  });
}