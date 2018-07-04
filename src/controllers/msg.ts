import {
  IMsgAPI,
} from "../models";
import {
  controller,
  http,
  IHttpAPICallParams,
  DateType,
  Context,
} from "../server";

export const msgResolver = {
  Query: {
    msgs: async (_obj: any,
      args: {
        id: string[] | null,
        date: DateType | null,
        limit: number
      }, context: Context,
      _info: any) => {
      const msgs = await context.repo.msg.find2(context.auth.token, {
        id: args.id,
        date: args.date
      }, args.limit);
      return msgs.map(x => x.toAPI(context.auth.token));
    }
  }
};

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
      required: ["type", "date", "limit"],
      properties: {
        type: {
          type: "string",
          enum: ["gt", "gte", "lt", "lte"],
        },
        date: {
          type: "string",
          format: "date-time",
        },
        limit: {
          type: "integer",
        },
      },
    },
  })
  async find({ params, auth, repo }: IHttpAPICallParams<{
    type: "gt" | "gte" | "lt" | "lte",
    equal: boolean,
    date: string,
    limit: number,
  }>): Promise<IMsgAPI[]> {
    const msgs = await repo.msg
      .find(auth.token, params.type, new Date(params.date), params.limit);
    return msgs.map(m => m.toAPI(auth.token));
  }
}
