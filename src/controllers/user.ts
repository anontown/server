import { ObjectIDGenerator } from "../generator";
import {
  IUserAPI,
  User,
} from "../models";
import {
  controller,
  http,
  IHttpAPICallParams,
} from "../server";

@controller
export class UserController {
  @http({
    url: "/user/auth",

    isAuthUser: true,
    isAuthToken: "no",
    schema: {
      type: "null",
    },
  })
  async auth({ }: IHttpAPICallParams<null>): Promise<null> {
    return null;
  }

  @http({
    url: "/user/create",

    isAuthUser: false,
    isAuthToken: "no",
    isRecaptcha: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["sn", "pass"],
      properties: {
        sn: {
          type: "string",
        },
        pass: {
          type: "string",
        },
      },
    },
  })
  async create({ params, now, repo }: IHttpAPICallParams<{
    sn: string,
    pass: string,
  }>): Promise<IUserAPI> {
    const user = User.create(ObjectIDGenerator, params.sn, params.pass, now);
    await repo.user.insert(user);
    return user.toAPI();
  }

  @http({
    url: "/user/find/id",

    isAuthUser: false,
    isAuthToken: "no",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["sn"],
      properties: {
        sn: {
          type: "string",
        },
      },
    },
  })
  async findID({ params, repo }: IHttpAPICallParams<{ sn: string }>): Promise<string> {
    return (await repo.user.findID(params.sn)).toString();
  }

  @http({
    url: "/user/find/sn",

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
  async findSN({ params, repo }: IHttpAPICallParams<{ id: string }>): Promise<string> {
    return (await repo.user.findOne(params.id)).sn;
  }

  @http({
    url: "/user/update",

    isAuthUser: true,
    isAuthToken: "no",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["pass", "sn"],
      properties: {
        pass: {
          type: "string",
        },
        sn: {
          type: "string",
        },
      },
    },
  })
  async update({ params, auth, repo }: IHttpAPICallParams<{ pass: string, sn: string }>): Promise<IUserAPI> {
    const user = await repo.user.findOne(auth.user.id);
    const newUser = user.change(auth.user, params.pass, params.sn);
    await repo.user.update(newUser);
    await repo.token.delMasterToken(auth.user);
    return newUser.toAPI();
  }
}
