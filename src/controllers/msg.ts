import {
  IMsgAPI,
} from "../models";
import {
  controller,
  http,
  IHttpAPICallParams
} from "../server";

@controller
export class MsgController {
  @http({
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
  })
  async findOne({ params, auth, repo }: IHttpAPICallParams<{ id: string }>): Promise<IMsgAPI> {
    const msg = await repo.msg.findOne(params.id);
    return msg.toAPI(auth.token);
  }

  @http({
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
  })
  async findIn({ params, auth, repo }: IHttpAPICallParams<{ ids: string[] }>): Promise<IMsgAPI[]> {
    const msgs = await repo.msg.findIn(params.ids);
    return msgs.map(m => m.toAPI(auth.token));
  }

  @http({
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
  })
  async find({ params, auth, repo }: IHttpAPICallParams<{
    type: "before" | "after",
    equal: boolean,
    date: string,
    limit: number,
  }>): Promise<IMsgAPI[]> {
    const msgs = await repo.msg
      .find(auth.token, params.type, params.equal, new Date(params.date), params.limit);
    return msgs.map(m => m.toAPI(auth.token));
  }

  @http({
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
  })
  async findNew({ params, auth, repo }: IHttpAPICallParams<{ limit: number }>): Promise<IMsgAPI[]> {
    const msgs = await repo.msg.findNew(auth.token, params.limit);
    return msgs.map(m => m.toAPI(auth.token));
  }
}