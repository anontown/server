import {
  IHistoryAPI,
} from "../models";
import {
  controller,
  http,
  IHttpAPICallParams
} from "../server";

@controller
export class HistoryController {
  @http({
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
  })
  async findOne({ params, repo }: IHttpAPICallParams<{ id: string }>): Promise<IHistoryAPI> {
    return (await repo.history.findOne(params.id))
      .toAPI();
  }

  @http({
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
  })
  async findIn({ params, repo }: IHttpAPICallParams<{ ids: string[] }>): Promise<IHistoryAPI[]> {
    return (await repo.history.findIn(params.ids))
      .map(h => h.toAPI());
  }

  @http({
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
  })
  async findAll({ params, repo }: IHttpAPICallParams<{ topic: string }>): Promise<IHistoryAPI[]> {
    return (await repo.history.findAll(await repo.topic.findOne(params.topic)))
      .map(h => h.toAPI());
  }
}
