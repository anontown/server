import { } from "../generator";
import {
  IMsgAPI,
} from "../models";
import { AppServer } from "../server";

export function addMsgAPI(api: AppServer) {
  api.addAPI<{ id: string }, IMsgAPI>({
    url: "/msg/find/one",

    isAuthUser: false,
    isAuthToken: "all",
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
      const msg = await repo.msg.findOne(params.id);
      return msg.toAPI(auth.token);
    },
  });

  api.addAPI<{ ids: string[] }, IMsgAPI[]>({
    url: "/msg/find/in",

    isAuthUser: false,
    isAuthToken: "all",
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
      const msgs = await repo.msg.findIn(params.ids);
      return msgs.map(m => m.toAPI(auth.token));
    },
  });

  api.addAPI<{
    type: "before" | "after",
    equal: boolean,
    date: string,
    limit: number,
  }, IMsgAPI[]>({
    url: "/msg/find",

    isAuthUser: false,
    isAuthToken: "all",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["type", "equal", "date", "limit"],
      properties: {
        type: {
          type: "string",
          enum: ["before", "after"],
        },
        equal: {
          type: "boolean",
        },
        date: {
          type: "string",
          format: "date-time",
        },
        limit: {
          type: "number",
        },
      },
    },
    call: async ({ params, auth, repo }) => {
      const msgs = await repo.msg
        .find(auth.token, params.type, params.equal, new Date(params.date), params.limit);
      return msgs.map(m => m.toAPI(auth.token));
    },
  });

  api.addAPI<{ limit: number }, IMsgAPI[]>({
    url: "/msg/find/new",

    isAuthUser: false,
    isAuthToken: "all",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["limit"],
      properties: {
        limit: {
          type: "number",
        },
      },
    },
    call: async ({ params, auth, repo }) => {
      const msgs = await repo.msg.findNew(auth.token, params.limit);
      return msgs.map(m => m.toAPI(auth.token));
    },
  });

}
