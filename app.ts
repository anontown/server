//MongoDBのWriteErrorを判定したいが、WriteErrorがインターフェイスで判定出来ない
//とりあえず問題は起こってないのでこのまま
require('source-map-support').install();
import { API } from './api';
import { IAuthToken, IAuthUser } from './auth';
import { Config } from './config';
import {
  User,
  Token,
  Client,
  Topic,
  Res,
  History,
  Msg,
  Profile,
  IClientAPI,
  IResAPI,
  ITopicAPI,
  IMsgAPI,
  IProfileAPI,
  ITokenAPI,
  IUserAPI,
  ITokenReqAPI
} from './models';
import { ObjectID } from 'mongodb';
import { Logger } from './logger';
import * as createDB from './create-db';

(async () => {
  //ロガー
  function appLog(method: string, ip: string, idName: string, id: ObjectID) {
    Logger.app.info(method, ip, idName, id.toString());
  }

  //DB更新
  await createDB.update();

  const api = new API(Config.server.port);


  //[res]
  {
    api.addAPI({
      url: "/res/create",

      isAuthUser: false,
      isAuthToken: true,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["topic", "name", "text", "reply", "profile"],
        properties: {
          topic: {
            type: "string"
          },
          name: {
            type: "string"
          },
          text: {
            type: "string"
          },
          reply: {
            type: ["string", "null"]
          },
          profile: {
            type: ["string", "null"]
          }
        }
      },
      call: async (params: {
        topic: string,
        name: string,
        text: string,
        reply: string | null,
        profile: string | null
      }, authToken: IAuthToken, _authUser: IAuthUser | null, ip: string): Promise<IResAPI> => {
        let val = await Promise.all([
          Topic.findOne(new ObjectID(params.topic)),
          User.findOne(authToken.user),
          params.reply !== null ? Res.findOne(new ObjectID(params.reply)) : Promise.resolve(null),
          params.profile !== null ? Profile.findOne(new ObjectID(params.profile)) : Promise.resolve(null)
        ]);

        let topic = val[0];
        let user = val[1];
        let reply = val[2];
        let profile = val[3];

        let res = Res.create(topic,
          user,
          authToken,
          params.name,
          null,
          params.text,
          reply,
          profile);

        await Promise.all([
          Res.insert(res),
          Topic.update(topic),
          User.update(user)
        ]);

        appLog("create/res", ip, "reses", res.id)
        return res.toAPI(authToken);
      }
    });

    api.addAPI({
      url: "/res/find/one",

      isAuthUser: false,
      isAuthToken: false,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["id"],
        properties: {
          id: {
            type: "string"
          }
        }
      },
      call: async (params: { id: string }, authToken: IAuthToken | null, _authUser: IAuthUser | null): Promise<IResAPI> => {
        let res = await Res.findOne(new ObjectID(params.id));
        return res.toAPI(authToken);
      }
    });

    api.addAPI({
      url: "/res/find/in",

      isAuthUser: false,
      isAuthToken: false,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["ids"],
        properties: {
          ids: {
            type: "array",
            items: {
              "type": "string"
            }
          }
        }
      },
      call: async (params: { ids: string[] }, authToken: IAuthToken | null, _authUser: IAuthUser | null): Promise<IResAPI[]> => {
        let reses = await Res.findIn(params.ids.map(id => new ObjectID(id)));
        return reses.map(r => r.toAPI(authToken));
      }
    });

    api.addAPI({
      url: "/res/find",

      isAuthUser: false,
      isAuthToken: false,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["topic", "type", "equal", "date", "limit"],
        properties: {
          topic: {
            type: "string"
          },
          type: {
            type: "string",
            enum: ["before", "after"]
          },
          equal: {
            type: "boolean"
          },
          date: {
            type: "string",
            format: "date-time"
          },
          limit: {
            type: "number"
          }
        }
      },
      call: async (params: { topic: string, type: "before" | "after", equal: boolean, date: string, limit: number }, authToken: IAuthToken | null, _authUser: IAuthUser | null): Promise<IResAPI[]> => {
        let topic = await Topic.findOne(new ObjectID(params.topic));
        let reses = await Res.find(topic, params.type, params.equal, new Date(params.date), params.limit);
        return reses.map(r => r.toAPI(authToken));
      }
    });

    api.addAPI({
      url: "/res/find/new",

      isAuthUser: false,
      isAuthToken: false,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["topic", "limit"],
        properties: {
          topic: {
            type: "string"
          },
          limit: {
            type: "number"
          }
        }
      },
      call: async (params: { topic: string, limit: number }, authToken: IAuthToken | null, _authUser: IAuthUser | null): Promise<IResAPI[]> => {
        let topic = await Topic.findOne(new ObjectID(params.topic));
        let reses = await Res.findNew(topic, params.limit);
        return reses.map(r => r.toAPI(authToken));
      }
    });

    api.addAPI({
      url: "/res/find/hash",

      isAuthUser: false,
      isAuthToken: false,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["topic", "hash"],
        properties: {
          topic: {
            type: "string"
          },
          hash: {
            type: "string"
          }
        }
      },
      call: async (params: { topic: string, hash: string }, authToken: IAuthToken | null, _authUser: IAuthUser | null): Promise<IResAPI[]> => {
        let topic = await Topic.findOne(new ObjectID(params.topic));
        let reses = await Res.findHash(topic, params.hash);
        return reses.map(r => r.toAPI(authToken));
      }
    });

    api.addAPI({
      url: "/res/find/reply",

      isAuthUser: false,
      isAuthToken: false,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["topic", "reply"],
        properties: {
          topic: {
            type: "string"
          },
          reply: {
            type: "string"
          }
        }
      },
      call: async (params: { topic: string, reply: string }, authToken: IAuthToken | null, _authUser: IAuthUser | null): Promise<IResAPI[]> => {
        let val = await Promise.all([
          Topic.findOne(new ObjectID(params.topic)),
          Res.findOne(new ObjectID(params.reply))
        ]);

        let topic = val[0];
        let res = val[1];

        let reses = await Res.findReply(topic, res);
        return reses.map(r => r.toAPI(authToken));
      }
    });

    api.addAPI({
      url: "/res/find/notice",

      isAuthUser: false,
      isAuthToken: true,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["type", "equal", "date", "limit"],
        properties: {
          type: {
            type: "string",
            enum: ["before", "after"]
          },
          equal: {
            type: "boolean"
          },
          date: {
            type: "string",
            format: "date-time"
          },
          limit: {
            type: "number"
          }
        }
      },
      call: async (params: { type: "before" | "after", equal: boolean, date: string, limit: number }, authToken: IAuthToken, _authUser: IAuthUser | null): Promise<IResAPI[]> => {
        let res = await Res.findNotice(authToken, params.type, params.equal, new Date(params.date), params.limit);
        return res.map(x => x.toAPI(authToken));
      }
    });

    api.addAPI({
      url: "/res/find/notice/new",

      isAuthUser: false,
      isAuthToken: true,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["limit"],
        properties: {
          limit: {
            type: "number"
          }
        }
      },
      call: async (params: { limit: number }, authToken: IAuthToken, _authUser: IAuthUser | null): Promise<IResAPI[]> => {
        let res = await Res.findNoticeNew(authToken, params.limit);
        return res.map(x => x.toAPI(authToken));
      }
    });

    api.addAPI({
      url: "/res/uv",

      isAuthUser: false,
      isAuthToken: true,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["id"],
        properties: {
          id: {
            type: "string"
          }
        }
      },
      call: async (params: { id: string }, authToken: IAuthToken, _authUser: IAuthUser | null): Promise<IResAPI> => {
        let val = await Promise.all([
          Res.findOne(new ObjectID(params.id)),
          User.findOne(authToken.user)
        ]);

        //レス
        let res = val[0];

        //投票するユーザー
        let user = val[1];

        //レスを書き込んだユーザー
        let resUser = await User.findOne(res.user);

        res.uv(resUser, user, authToken);

        await Promise.all([
          Res.update(res),
          User.update(resUser),
          User.update(user)
        ]);

        return res.toAPI(authToken);
      }
    });

    api.addAPI({
      url: "/res/dv",

      isAuthUser: false,
      isAuthToken: true,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["id"],
        properties: {
          id: {
            type: "string"
          }
        }
      },
      call: async (params: { id: string }, authToken: IAuthToken, _authUser: IAuthUser | null): Promise<IResAPI> => {
        let val = await Promise.all([
          Res.findOne(new ObjectID(params.id)),
          User.findOne(authToken.user)
        ]);

        let res = val[0];

        //投票するユーザー
        let user = val[1];

        //レスを書き込んだユーザー
        let resUser = await User.findOne(res.user);

        let msg = res.dv(resUser, user, authToken);

        let promise = [
          Res.update(res),
          User.update(resUser),
          User.update(user)
        ];
        if (msg !== null) {
          promise.push(Msg.insert(msg));
        }

        await Promise.all(promise);

        return res.toAPI(authToken);
      }
    });

    api.addAPI({
      url: "/res/del",

      isAuthUser: false,
      isAuthToken: true,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["id"],
        properties: {
          id: {
            type: "string"
          }
        }
      },
      call: async (params: { id: string }, authToken: IAuthToken, _authUser: IAuthUser | null): Promise<IResAPI> => {
        //レス
        let res = await Res.findOne(new ObjectID(params.id));
        //レスを書き込んだユーザー
        let resUser = await User.findOne(res.user);

        res.del(resUser, authToken);

        await Promise.all([
          Res.update(res),
          User.update(resUser)
        ]);

        return res.toAPI(authToken);
      }
    });
  }
  //[topic]
  {
    api.addAPI({
      url: "/topic/create",

      isAuthUser: false,
      isAuthToken: true,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["title", "category", "text"],
        properties: {
          title: {
            type: "string"
          },
          category: {
            type: "array",
            items: {
              "type": "string"
            }
          },
          text: {
            type: "string"
          }
        }
      },
      call: async (params: {
        title: string,
        category: string[],
        text: string
      }, authToken: IAuthToken, _authUser: IAuthUser | null, ip: string): Promise<ITopicAPI> => {
        let user = await User.findOne(authToken.user);
        let create = Topic.create(params.title,
          params.category,
          params.text,
          user,
          authToken);

        await Topic.insert(create.topic);
        await Promise.all([
          User.update(user),
          Res.insert(create.res),
          History.insert(create.history)
        ]);

        appLog("topic/create", ip, "histories", create.history.id);
        return create.topic.toAPI();
      }
    });

    api.addAPI({
      url: "/topic/find/one",

      isAuthUser: false,
      isAuthToken: false,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["id"],
        properties: {
          id: {
            type: "string"
          }
        }
      },
      call: async (params: { id: string }, _authToken: IAuthToken | null, _authUser: IAuthUser | null): Promise<ITopicAPI> => {
        let topic = await Topic.findOne(new ObjectID(params.id));
        return topic.toAPI();
      }
    });

    api.addAPI({
      url: "/topic/find/in",

      isAuthUser: false,
      isAuthToken: false,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["ids"],
        properties: {
          ids: {
            type: "array",
            items: {
              "type": "string"
            }
          }
        }
      },
      call: async (params: { ids: string[] }, _authToken: IAuthToken | null, _authUser: IAuthUser | null): Promise<ITopicAPI[]> => {
        let topics = await Topic.findIn(params.ids.map(id => new ObjectID(id)));
        return topics.map(t => t.toAPI());
      }
    });

    api.addAPI({
      url: "/topic/find",

      isAuthUser: false,
      isAuthToken: false,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["title", "category", "skip", "limit"],
        properties: {
          title: {
            type: "string"
          },
          category: {
            type: "array",
            items: {
              "type": "string"
            }
          },
          skip: {
            type: "number"
          },
          limit: {
            type: "number"
          }
        }
      },
      call: async (params: { title: string, category: string[], skip: number, limit: number }, _authToken: IAuthToken | null, _authUser: IAuthUser | null): Promise<ITopicAPI[]> => {
        let topic = await Topic.find(params.title, params.category, params.skip, params.limit)
        return topic.map(t => t.toAPI());
      }
    });

    api.addAPI({
      url: "/topic/update",

      isAuthUser: false,
      isAuthToken: true,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["id", "title", "category", "text"],
        properties: {
          id: {
            type: "string"
          },
          title: {
            type: "string"
          },
          category: {
            type: "array",
            items: {
              "type": "string"
            }
          },
          text: {
            type: "string"
          }
        }
      },
      call: async (params: { id: string, title: string, category: string[], text: string }, authToken: IAuthToken, _authUser: IAuthUser | null, ip): Promise<ITopicAPI> => {
        let val = await Promise.all([
          Topic.findOne(new ObjectID(params.id)),
          User.findOne(authToken.user)
        ]);

        let topic = val[0];
        let user = val[1];

        let val2 = topic.changeData(user, authToken, params.title, params.category, params.text);
        let res = val2.res;
        let history = val2.history;

        await Promise.all([
          Res.insert(res),
          History.insert(history),
          Topic.update(topic),
          User.update(user)
        ]);

        appLog("topic/update", ip, "histories", history.id);
        return topic.toAPI();
      }
    });
  }
  //[msg]
  {
    api.addAPI({
      url: "/msg/find/one",

      isAuthUser: false,
      isAuthToken: true,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["id"],
        properties: {
          id: {
            type: "string"
          }
        }
      },
      call: async (params: { id: string }, authToken: IAuthToken, _authUser: IAuthUser | null): Promise<IMsgAPI> => {
        let msg = await Msg.findOne(authToken, new ObjectID(params.id));
        return msg.toAPI();
      }
    });

    api.addAPI({
      url: "/msg/find/in",

      isAuthUser: false,
      isAuthToken: true,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["ids"],
        properties: {
          ids: {
            type: "array",
            items: {
              "type": "string"
            }
          }
        }
      },
      call: async (params: { ids: string[] }, authToken: IAuthToken, _authUser: IAuthUser | null): Promise<IMsgAPI[]> => {
        let msgs = await Msg.findIn(authToken, params.ids.map(id => new ObjectID(id)));
        return msgs.map(m => m.toAPI());
      }
    });

    api.addAPI({
      url: "/msg/find",

      isAuthUser: false,
      isAuthToken: true,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["type", "equal", "date", "limit"],
        properties: {
          type: {
            type: "string",
            enum: ["before", "after"]
          },
          equal: {
            type: "boolean"
          },
          date: {
            type: "string",
            format: "date-time"
          },
          limit: {
            type: "number"
          }
        }
      },
      call: async (params: { type: "before" | "after", equal: boolean, date: string, limit: number }, authToken: IAuthToken, _authUser: IAuthUser | null): Promise<IMsgAPI[]> => {
        let msgs = await Msg.find(authToken, params.type, params.equal, new Date(params.date), params.limit);
        return msgs.map(m => m.toAPI());
      }
    });

    api.addAPI({
      url: "/msg/find/new",

      isAuthUser: false,
      isAuthToken: true,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["limit"],
        properties: {
          limit: {
            type: "number"
          }
        }
      },
      call: async (params: { limit: number }, authToken: IAuthToken, _authUser: IAuthUser | null): Promise<IMsgAPI[]> => {
        let msgs = await Msg.findNew(authToken, params.limit);
        return msgs.map(m => m.toAPI());
      }
    });
  }
  //[profile] 
  {
    api.addAPI({
      url: "/profile/create",

      isAuthUser: false,
      isAuthToken: true,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["name", "text"],
        properties: {
          name: {
            type: "string"
          },
          text: {
            type: "string"
          }
        }
      },
      call: async (params: { name: string, text: string }, authToken: IAuthToken, _authUser: IAuthUser | null, ip: string): Promise<IProfileAPI> => {
        let profile = Profile.create(authToken, params.name, params.text);
        await Profile.insert(profile);
        appLog("profile/create", ip, "profiles", profile.id);
        return profile.toAPI(authToken);
      }
    });

    api.addAPI({
      url: "/profile/find/one",

      isAuthUser: false,
      isAuthToken: false,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["id"],
        properties: {
          id: {
            type: "string"
          }
        }
      },
      call: async (params: { id: string }, authToken: IAuthToken | null, _authUser: IAuthUser | null): Promise<IProfileAPI> => {
        let profile = await Profile.findOne(new ObjectID(params.id));
        return profile.toAPI(authToken);
      }
    });

    api.addAPI({
      url: "/profile/find/in",

      isAuthUser: false,
      isAuthToken: false,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["ids"],
        properties: {
          ids: {
            type: "array",
            items: {
              type: "string"
            }
          }
        }
      },
      call: async (params: { ids: string[] }, authToken: IAuthToken | null, _authUser: IAuthUser | null): Promise<IProfileAPI[]> => {
        let profiles = await Profile.findIn(params.ids.map(id => new ObjectID(id)));
        return profiles.map(p => p.toAPI(authToken));
      }
    });

    api.addAPI({
      url: "/profile/find/all",

      isAuthUser: false,
      isAuthToken: true,
      schema: {
        type: "null"
      },
      call: async (_params: null, authToken: IAuthToken, _authUser: IAuthUser | null): Promise<IProfileAPI[]> => {
        let profiles = await Profile.findAll(authToken);
        return profiles.map(p => p.toAPI(authToken));
      }
    });

    api.addAPI({
      url: "/profile/update",

      isAuthUser: false,
      isAuthToken: true,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["id", "name", "text"],
        properties: {
          id: {
            type: "string"
          },
          name: {
            type: "string"
          },
          text: {
            type: "string"
          }
        }
      },
      call: async (params: { id: string, name: string, text: string }, authToken: IAuthToken, _authUser: IAuthUser | null, ip: string): Promise<IProfileAPI> => {
        let profile = await Profile.findOne(new ObjectID(params.id));
        profile.changeData(authToken, params.name, params.text);
        await Profile.update(profile);
        appLog("profile/update", ip, "profiles", profile.id);
        return profile.toAPI(authToken);
      }
    });
  }
  //[token]
  {
    api.addAPI({
      url: "/token/find/one",

      isAuthUser: false,
      isAuthToken: true,
      schema: {
        type: "null"
      },
      call: async (_params: null, authToken: IAuthToken, _authUser: IAuthUser | null): Promise<ITokenAPI> => {
        let token = await Token.findOne(authToken.id);
        return token.toAPI();
      }
    });

    api.addAPI({
      url: "/token/find/all",

      isAuthUser: true,
      isAuthToken: false,
      schema: {
        type: "null"
      },
      call: async (_params: null, _authToken: IAuthToken | null, authUser: IAuthUser): Promise<ITokenAPI[]> => {
        let tokens = await Token.findAll(authUser);
        return tokens.map(t => t.toAPI());
      }
    });

    api.addAPI({
      url: "/token/enable",

      isAuthUser: true,
      isAuthToken: false,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["id"],
        properties: {
          id: {
            type: "string"
          }
        }
      },
      call: async (params: { id: string }, _authToken: IAuthToken | null, authUser: IAuthUser): Promise<ITokenAPI> => {
        let token = await Token.findOne(new ObjectID(params.id));
        await token.enable(authUser);
        return token.toAPI();
      }
    });

    api.addAPI({
      url: "/token/disable",

      isAuthUser: true,
      isAuthToken: false,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["id"],
        properties: {
          id: {
            type: "string"
          }
        }
      },
      call: async (params: { id: string }, _authToken: IAuthToken | null, authUser: IAuthUser): Promise<ITokenAPI> => {
        let token = await Token.findOne(new ObjectID(params.id));
        await token.disable(authUser);
        return token.toAPI();
      }
    });

    api.addAPI({
      url: "/token/update",

      isAuthUser: true,
      isAuthToken: false,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["id"],
        properties: {
          id: {
            type: "string"
          }
        }
      },
      call: async (params: { id: string }, _authToken: IAuthToken | null, authUser: IAuthUser): Promise<ITokenAPI> => {
        let token = await Token.findOne(new ObjectID(params.id));
        await token.keyChange(authUser);
        return token.toAPI();
      }
    });

    api.addAPI({
      url: "/token/create",

      isAuthUser: true,
      isAuthToken: false,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["client"],
        properties: {
          client: {
            type: "string"
          }
        }
      },
      call: async (params: { client: string }, _authToken: IAuthToken | null, authUser: IAuthUser): Promise<ITokenAPI> => {
        let client = await Client.findOne(new ObjectID(params.client));
        let token = Token.create(authUser, client);
        await Token.insert(token);

        return token.toAPI();
      }
    });

    api.addAPI({
      url: "/token/storage/set",

      isAuthUser: false,
      isAuthToken: true,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["value"],
        properties: {
          value: {
            type: "string"
          }
        }
      },
      call: async (params: { value: "string" }, authToken: IAuthToken, _authUser: IAuthUser | null): Promise<null> => {
        let token = await Token.findOne(authToken.id);
        token.storage = params.value;
        Token.update(token);
        return null;
      }
    });

    api.addAPI({
      url: "/token/storage/get",

      isAuthUser: false,
      isAuthToken: true,
      schema: {
        type: "null"
      },
      call: async (_params: null, authToken: IAuthToken, _authUser: IAuthUser | null): Promise<string> => {
        let token = await Token.findOne(authToken.id);
        return token.storage;
      }
    });

    api.addAPI({
      url: "/token/req/create",

      isAuthUser: false,
      isAuthToken: true,
      schema: {
        type: "null"
      },
      call: async (_params: null, authToken: IAuthToken, _authUser: IAuthUser | null): Promise<ITokenReqAPI> => {
        let token = await Token.findOne(authToken.id);
        let req = token.createReq();

        await Token.update(token);

        return req;
      }
    });

    api.addAPI({
      url: "/token/find/req",

      isAuthUser: false,
      isAuthToken: false,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["id", "key"],
        properties: {
          id: {
            type: "string",
          },
          key: {
            type: "string"
          }
        }
      },
      call: async (params: { id: string, key: string }, _authToken: IAuthToken | null, _authUser: IAuthUser | null): Promise<ITokenAPI> => {
        let token = await Token.findOne(new ObjectID(params.id));
        token.authReq(params.key);
        return token.toAPI();
      }
    });
  }
  //[user]
  {
    api.addAPI({
      url: "/user/create",

      isAuthUser: false,
      isAuthToken: false,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["sn", "pass"],
        properties: {
          sn: {
            type: "string"
          },
          pass: {
            type: "string"
          }
        }
      },
      call: async (params: { sn: string, pass: string }, _authToken: IAuthToken | null, _authUser: IAuthUser | null): Promise<IUserAPI> => {
        let user = User.create(params.sn, params.pass);
        await User.insert(user);
        return user.toAPI();
      }
    });
    api.addAPI({
      url: "/user/find/id",

      isAuthUser: false,
      isAuthToken: false,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["sn"],
        properties: {
          sn: {
            type: "string"
          }
        }
      },
      call: async (params: { sn: string }, _authToken: IAuthToken | null, _authUser: IAuthUser | null): Promise<string> => {
        return (await User.findID(params.sn)).toString();
      }
    });
    api.addAPI({
      url: "/user/update",

      isAuthUser: true,
      isAuthToken: false,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["pass"],
        properties: {
          pass: {
            type: "string"
          }
        }
      },
      call: async (params: { pass: string }, _authToken: IAuthToken | null, authUser: IAuthUser): Promise<IUserAPI> => {
        let user = await User.findOne(authUser.id);
        user.changePass(authUser, params.pass);
        User.update(user);
        return user.toAPI();
      }
    });
  }
  //[client]
  {
    api.addAPI({
      url: "/client/create",

      isAuthUser: true,
      isAuthToken: false,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["name", "url"],
        properties: {
          name: {
            type: "string"
          },
          url: {
            type: "string"
          }
        }
      },
      call: async (params: { name: string, url: string }, _authToken: IAuthToken | null, authUser: IAuthUser, ip: string): Promise<IClientAPI> => {
        let client = Client.create(authUser, params.name, params.url);
        await Client.insert(client);
        appLog("client/create", ip, "clients", client.id);
        return client.toAPI(authUser);
      }
    });

    api.addAPI({
      url: "/client/update",

      isAuthUser: true,
      isAuthToken: false,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["id", "name", "url"],
        properties: {
          id: {
            type: "string"
          },
          name: {
            type: "string"
          },
          url: {
            type: "string"
          }
        }
      },
      call: async (params: { id: string, name: string, url: string }, _authToken: IAuthToken | null, authUser: IAuthUser, ip: string): Promise<IClientAPI> => {
        let client = await Client.findOne(new ObjectID(params.id));
        client.changeData(authUser, params.name, params.url);
        await Client.update(client);
        appLog("client/update", ip, "clients", client.id);
        return client.toAPI(authUser);
      }
    });

    api.addAPI({
      url: "/client/find/one",

      isAuthUser: false,
      isAuthToken: false,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["id"],
        properties: {
          id: {
            type: "string"
          }
        }
      },
      call: async (params: { id: string }, _authToken: IAuthToken | null, authUser: IAuthUser | null): Promise<IClientAPI> => {
        let client = await Client.findOne(new ObjectID(params.id));
        return client.toAPI(authUser);
      }
    });

    api.addAPI({
      url: "/client/find/in",

      isAuthUser: false,
      isAuthToken: false,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["ids"],
        properties: {
          ids: {
            type: "array",
            items: {
              type: "string"
            }
          }
        }
      },
      call: async (params: { ids: string[] }, _authToken: IAuthToken | null, authUser: IAuthUser | null): Promise<IClientAPI[]> => {
        let clients = await Client.findIn(params.ids.map(id => new ObjectID(id)));
        return clients.map(c => c.toAPI(authUser));
      }
    });

    api.addAPI({
      url: "/client/find/all",

      isAuthUser: true,
      isAuthToken: false,
      schema: {
        type: "null",
      },
      call: async (_params: null, _authToken: IAuthToken | null, authUser: IAuthUser): Promise<IClientAPI[]> => {
        let clients = await Client.findAll(authUser);
        return clients.map(c => c.toAPI(authUser));
      }
    });
  }

  api.addAPI({
    url: "/user/auth",

    isAuthUser: true,
    isAuthToken: false,
    schema: {
      type: "null",
    },
    call: async (_params: null, _authToken: IAuthToken | null, _authUser: IAuthUser): Promise<null> => {
      return null;
    }
  });

  api.run();

  //cron
  User.cron();
})();
