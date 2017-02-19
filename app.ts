//MongoDBのWriteErrorを判定したいが、WriteErrorがインターフェイスで判定出来ない
//とりあえず問題は起こってないのでこのまま
require('source-map-support').install();
import { API } from './api';
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
  ITokenReqAPI,
  IHistoryAPI,
  TopicType
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
    api.addAPI<{
      topic: string,
      name: string,
      text: string,
      reply: string | null,
      profile: string | null,
      age: boolean
    }>({
      url: "/res/create",

      isAuthUser: false,
      isAuthToken: true,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["topic", "name", "text", "reply", "profile", "age"],
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
          },
          age: {
            type: "boolean"
          }
        }
      },
      call: async ({params, authToken, ip, now}): Promise<IResAPI> => {
        let val = await Promise.all([
          Topic.findOne(new ObjectID(params.topic)),
          User.findOne(authToken!.user),
          params.reply !== null ? Res.findOne(new ObjectID(params.reply)) : Promise.resolve(null),
          params.profile !== null ? Profile.findOne(new ObjectID(params.profile)) : Promise.resolve(null)
        ]);

        let topic = val[0];
        let user = val[1];
        let reply = val[2];
        let profile = val[3];
        let res = Res.create(topic,
          user,
          authToken!,
          params.name,
          null,
          params.text,
          reply,
          profile,
          params.age,
          now);

        await Promise.all([
          Res.insert(res),
          Topic.update(topic),
          User.update(user)
        ]);

        appLog("create/res", ip, "reses", res.id)
        return res.toAPI(authToken);
      }
    });

    api.addAPI<{ id: string }>({
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
      call: async ({params, authToken}): Promise<IResAPI> => {
        let res = await Res.findOne(new ObjectID(params.id));
        return res.toAPI(authToken);
      }
    });

    api.addAPI<{ ids: string[] }>({
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
      call: async ({params, authToken}): Promise<IResAPI[]> => {
        let reses = await Res.findIn(params.ids.map(id => new ObjectID(id)));
        return reses.map(r => r.toAPI(authToken));
      }
    });

    api.addAPI<{
      topic: string,
      type: "before" | "after",
      equal: boolean,
      date: string,
      limit: number
    }>({
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
      call: async ({params, authToken}): Promise<IResAPI[]> => {
        let topic = await Topic.findOne(new ObjectID(params.topic));
        let reses = await Res.find(topic, params.type, params.equal, new Date(params.date), params.limit);
        return reses.map(r => r.toAPI(authToken));
      }
    });

    api.addAPI<{ topic: string, limit: number }>({
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
      call: async ({params, authToken}): Promise<IResAPI[]> => {
        let topic = await Topic.findOne(new ObjectID(params.topic));
        let reses = await Res.findNew(topic, params.limit);
        return reses.map(r => r.toAPI(authToken));
      }
    });

    api.addAPI<{ topic: string, hash: string }>({
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
      call: async ({params, authToken}): Promise<IResAPI[]> => {
        let topic = await Topic.findOne(new ObjectID(params.topic));
        let reses = await Res.findHash(topic, params.hash);
        return reses.map(r => r.toAPI(authToken));
      }
    });

    api.addAPI<{ topic: string, reply: string }>({
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
      call: async ({params, authToken}): Promise<IResAPI[]> => {
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

    api.addAPI<{
      type: "before" | "after",
      equal: boolean,
      date: string,
      limit: number
    }>({
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
      call: async ({params, authToken}): Promise<IResAPI[]> => {
        let res = await Res.findNotice(authToken!, params.type, params.equal, new Date(params.date), params.limit);
        return res.map(x => x.toAPI(authToken));
      }
    });

    api.addAPI<{ limit: number }>({
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
      call: async ({params, authToken}): Promise<IResAPI[]> => {
        let res = await Res.findNoticeNew(authToken!, params.limit);
        return res.map(x => x.toAPI(authToken));
      }
    });

    api.addAPI<{ id: string }>({
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
      call: async ({params, authToken}): Promise<IResAPI> => {
        let val = await Promise.all([
          Res.findOne(new ObjectID(params.id)),
          User.findOne(authToken!.user)
        ]);

        //レス
        let res = val[0];

        //投票するユーザー
        let user = val[1];

        //レスを書き込んだユーザー
        let resUser = await User.findOne(res.user);

        res.uv(resUser, user, authToken!);

        await Promise.all([
          Res.update(res),
          User.update(resUser),
          User.update(user)
        ]);

        return res.toAPI(authToken);
      }
    });

    api.addAPI<{ id: string }>({
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
      call: async ({params, authToken, now}): Promise<IResAPI> => {
        let val = await Promise.all([
          Res.findOne(new ObjectID(params.id)),
          User.findOne(authToken!.user)
        ]);

        let res = val[0];

        //投票するユーザー
        let user = val[1];

        //レスを書き込んだユーザー
        let resUser = await User.findOne(res.user);

        let msg = res.dv(resUser, user, authToken!, now);

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

    api.addAPI<{ id: string }>({
      url: "/res/cv",

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
      call: async ({params, authToken}): Promise<IResAPI> => {
        let val = await Promise.all([
          Res.findOne(new ObjectID(params.id)),
          User.findOne(authToken!.user)
        ]);

        //レス
        let res = val[0];

        //投票するユーザー
        let user = val[1];

        //レスを書き込んだユーザー
        let resUser = await User.findOne(res.user);

        res.cv(resUser, user, authToken!);

        await Promise.all([
          Res.update(res),
          User.update(resUser),
          User.update(user)
        ]);

        return res.toAPI(authToken);
      }
    });

    api.addAPI<{ id: string }>({
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
      call: async ({params, authToken}): Promise<IResAPI> => {
        //レス
        let res = await Res.findOne(new ObjectID(params.id));
        //レスを書き込んだユーザー
        let resUser = await User.findOne(res.user);

        res.del(resUser, authToken!);

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
    api.addAPI<{
      title: string,
      tags: string[],
      text: string,
      type: TopicType
    }>({
      url: "/topic/create",

      isAuthUser: false,
      isAuthToken: true,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["title", "tags", "text", "type"],
        properties: {
          title: {
            type: "string"
          },
          tags: {
            type: "array",
            items: {
              "type": "string"
            }
          },
          text: {
            type: "string"
          },
          type: {
            type: "string",
            enum: ["normal", "one"]
          }
        }
      },
      call: async ({params, authToken, ip, now}): Promise<ITopicAPI> => {
        let user = await User.findOne(authToken!.user);
        let create = Topic.create(params.title,
          params.tags,
          params.text,
          user,
          params.type,
          authToken!,
          now);

        await Topic.insert(create.topic);
        await Promise.all([
          User.update(user),
          Res.insert(create.res),
          create.history ? History.insert(create.history) : Promise.resolve()
        ]);
        if (create.history) {
          appLog("topic/create", ip, "histories", create.history.id);
        }
        return create.topic.toAPI();
      }
    });

    api.addAPI<{ id: string }>({
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
      call: async ({params}): Promise<ITopicAPI> => {
        let topic = await Topic.findOne(new ObjectID(params.id));
        return topic.toAPI();
      }
    });

    api.addAPI<{ ids: string[] }>({
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
      call: async ({params}): Promise<ITopicAPI[]> => {
        let topics = await Topic.findIn(params.ids.map(id => new ObjectID(id)));
        return topics.map(t => t.toAPI());
      }
    });

    api.addAPI<{
      title: string,
      tags: string[],
      skip: number,
      limit: number,
      activeOnly: boolean
    }>({
      url: "/topic/find",

      isAuthUser: false,
      isAuthToken: false,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["title", "tags", "skip", "limit", "activeOnly"],
        properties: {
          title: {
            type: "string"
          },
          tags: {
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
          },
          activeOnly: {
            type: "boolean"
          }
        }
      },
      call: async ({params}): Promise<ITopicAPI[]> => {
        let topic = await Topic.find(params.title, params.tags, params.skip, params.limit, params.activeOnly)
        return topic.map(t => t.toAPI());
      }
    });

    api.addAPI<{ limit: number }>({
      url: "/topic/find/tags",

      isAuthUser: false,
      isAuthToken: false,
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
      call: async ({params}): Promise<{ name: string, count: number }[]> => {
        return await Topic.findTags(params.limit)
      }
    });

    api.addAPI<{
      id: string,
      title: string,
      tags: string[],
      text: string
    }>({
      url: "/topic/update",

      isAuthUser: false,
      isAuthToken: true,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["id", "title", "tags", "text"],
        properties: {
          id: {
            type: "string"
          },
          title: {
            type: "string"
          },
          tags: {
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
      call: async ({params, authToken, ip, now}): Promise<ITopicAPI> => {
        let val = await Promise.all([
          Topic.findOne(new ObjectID(params.id)),
          User.findOne(authToken!.user)
        ]);

        let topic = val[0];
        let user = val[1];

        let val2 = topic.changeData(user, authToken!, params.title, params.tags, params.text, now);
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
  //[history]
  {
    api.addAPI<{ id: string }>({
      url: "/history/find/one",

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
      call: async ({params}): Promise<IHistoryAPI> => {
        return (await History.findOne(new ObjectID(params.id)))
          .toAPI();
      }
    });

    api.addAPI<{ ids: string[] }>({
      url: "/history/find/in",

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
      call: async ({params}): Promise<IHistoryAPI[]> => {
        return (await History.findIn(params.ids.map(id => new ObjectID(id))))
          .map(h => h.toAPI());
      }
    });

    api.addAPI<{ topic: string }>({
      url: "/history/find/all",

      isAuthUser: false,
      isAuthToken: false,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["topic"],
        properties: {
          topic: {
            type: "string"
          }
        }
      },
      call: async ({params}): Promise<IHistoryAPI[]> => {
        return (await History.findAll(await Topic.findOne(new ObjectID(params.topic))))
          .map(h => h.toAPI());
      }
    });
  }
  //[msg]
  {
    api.addAPI<{ id: string }>({
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
      call: async ({params, authToken}): Promise<IMsgAPI> => {
        let msg = await Msg.findOne(authToken!, new ObjectID(params.id));
        return msg.toAPI();
      }
    });

    api.addAPI<{ ids: string[] }>({
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
      call: async ({params, authToken}): Promise<IMsgAPI[]> => {
        let msgs = await Msg.findIn(authToken!, params.ids.map(id => new ObjectID(id)));
        return msgs.map(m => m.toAPI());
      }
    });

    api.addAPI<{
      type: "before" | "after",
      equal: boolean,
      date: string,
      limit: number
    }>({
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
      call: async ({params, authToken}): Promise<IMsgAPI[]> => {
        let msgs = await Msg.find(authToken!, params.type, params.equal, new Date(params.date), params.limit);
        return msgs.map(m => m.toAPI());
      }
    });

    api.addAPI<{ limit: number }>({
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
      call: async ({params, authToken}): Promise<IMsgAPI[]> => {
        let msgs = await Msg.findNew(authToken!, params.limit);
        return msgs.map(m => m.toAPI());
      }
    });
  }
  //[profile] 
  {
    api.addAPI<{
      name: string,
      text: string,
      sn: string
    }>({
      url: "/profile/create",

      isAuthUser: false,
      isAuthToken: true,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["name", "text", "sn"],
        properties: {
          name: {
            type: "string"
          },
          text: {
            type: "string"
          },
          sn: {
            type: "string"
          }
        }
      },
      call: async ({params, authToken, ip, now}): Promise<IProfileAPI> => {
        let profile = Profile.create(authToken!, params.name, params.text, params.sn, now);
        await Profile.insert(profile);
        appLog("profile/create", ip, "profiles", profile.id);
        return profile.toAPI(authToken);
      }
    });

    api.addAPI<{ id: string }>({
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
      call: async ({params, authToken}): Promise<IProfileAPI> => {
        let profile = await Profile.findOne(new ObjectID(params.id));
        return profile.toAPI(authToken);
      }
    });

    api.addAPI<{ ids: string[] }>({
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
      call: async ({params, authToken}): Promise<IProfileAPI[]> => {
        let profiles = await Profile.findIn(params.ids.map(id => new ObjectID(id)));
        return profiles.map(p => p.toAPI(authToken));
      }
    });

    api.addAPI<null>({
      url: "/profile/find/all",

      isAuthUser: false,
      isAuthToken: true,
      schema: {
        type: "null"
      },
      call: async ({authToken}): Promise<IProfileAPI[]> => {
        let profiles = await Profile.findAll(authToken!);
        return profiles.map(p => p.toAPI(authToken));
      }
    });

    api.addAPI<{
      id: string,
      name: string,
      text: string,
      sn: string
    }>({
      url: "/profile/update",

      isAuthUser: false,
      isAuthToken: true,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["id", "name", "text", "sn"],
        properties: {
          id: {
            type: "string"
          },
          name: {
            type: "string"
          },
          text: {
            type: "string"
          },
          sn: {
            type: "string"
          }
        }
      },
      call: async ({params, authToken, ip, now}): Promise<IProfileAPI> => {
        let profile = await Profile.findOne(new ObjectID(params.id));
        profile.changeData(authToken!, params.name, params.text, params.sn, now);
        await Profile.update(profile);
        appLog("profile/update", ip, "profiles", profile.id);
        return profile.toAPI(authToken);
      }
    });
  }
  //[token]
  {
    api.addAPI<null>({
      url: "/token/find/one",

      isAuthUser: false,
      isAuthToken: true,
      schema: {
        type: "null"
      },
      call: async ({authToken}): Promise<ITokenAPI> => {
        let token = await Token.findOne(authToken!.id);
        return token.toAPI();
      }
    });

    api.addAPI<null>({
      url: "/token/find/all",

      isAuthUser: true,
      isAuthToken: false,
      schema: {
        type: "null"
      },
      call: async ({authUser}): Promise<ITokenAPI[]> => {
        let tokens = await Token.findAll(authUser!);
        return tokens.map(t => t.toAPI());
      }
    });

    api.addAPI<{ id: string }>({
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
      call: async ({params, authUser}): Promise<ITokenAPI> => {
        let token = await Token.findOne(new ObjectID(params.id));
        await token.enable(authUser!);
        return token.toAPI();
      }
    });

    api.addAPI<{ id: string }>({
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
      call: async ({params, authUser}): Promise<ITokenAPI> => {
        let token = await Token.findOne(new ObjectID(params.id));
        await token.disable(authUser!);
        return token.toAPI();
      }
    });

    api.addAPI<{ id: string }>({
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
      call: async ({params, authUser}): Promise<ITokenAPI> => {
        let token = await Token.findOne(new ObjectID(params.id));
        await token.keyChange(authUser!);
        return token.toAPI();
      }
    });

    api.addAPI<{ client: string }>({
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
      call: async ({params, authUser, now}): Promise<ITokenAPI> => {
        let client = await Client.findOne(new ObjectID(params.client));
        let token = Token.create(authUser!, client, now);
        await Token.insert(token);

        return token.toAPI();
      }
    });

    api.addAPI<{ name: string, value: string }>({
      url: "/token/storage/set",

      isAuthUser: false,
      isAuthToken: true,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["name", "value"],
        properties: {
          name: {
            type: "string"
          },
          value: {
            type: "string"
          }
        }
      },
      call: async ({params, authToken}): Promise<null> => {
        let token = await Token.findOne(authToken!.id);
        await token.setStorage(params.name, params.value);
        return null;
      }
    });

    api.addAPI<{ name: string }>({
      url: "/token/storage/get",

      isAuthUser: false,
      isAuthToken: true,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["name"],
        properties: {
          name: {
            type: "string"
          }
        }
      },
      call: async ({params, authToken}): Promise<string> => {
        let token = await Token.findOne(authToken!.id);
        return await token.getStorage(params.name);
      }
    });

    api.addAPI<{ name: string }>({
      url: "/token/storage/delete",

      isAuthUser: false,
      isAuthToken: true,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["name"],
        properties: {
          name: {
            type: "string"
          }
        }
      },
      call: async ({params, authToken}): Promise<null> => {
        let token = await Token.findOne(authToken!.id);
        await token.deleteStorage(params.name);
        return null;
      }
    });

    api.addAPI<null>({
      url: "/token/storage/list",

      isAuthUser: false,
      isAuthToken: true,
      schema: {
        type: "null"
      },
      call: async ({authToken}): Promise<string[]> => {
        let token = await Token.findOne(authToken!.id);
        return await token.listStorage();
      }
    });

    api.addAPI<null>({
      url: "/token/req/create",

      isAuthUser: false,
      isAuthToken: true,
      schema: {
        type: "null"
      },
      call: async ({authToken, now}): Promise<ITokenReqAPI> => {
        let token = await Token.findOne(authToken!.id);
        let req = token.createReq(now);

        await Token.update(token);

        return req;
      }
    });

    api.addAPI<{ id: string, key: string }>({
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
      call: async ({params, now}): Promise<ITokenAPI> => {
        let token = await Token.findOne(new ObjectID(params.id));
        token.authReq(params.key, now);
        return token.toAPI();
      }
    });
  }
  //[user]
  {
    api.addAPI<{
      sn: string,
      pass: string
    }>({
      url: "/user/create",

      isAuthUser: false,
      isAuthToken: false,
      isRecaptcha: true,
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
      call: async ({params, now}): Promise<IUserAPI> => {
        let user = await User.create(params.sn, params.pass, now);
        await User.insert(user);
        return user.toAPI();
      }
    });
    api.addAPI<{ sn: string }>({
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
      call: async ({params}): Promise<string> => {
        return (await User.findID(params.sn)).toString();
      }
    });
    api.addAPI<{ pass: string, sn: string }>({
      url: "/user/update",

      isAuthUser: true,
      isAuthToken: false,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["pass", "sn"],
        properties: {
          pass: {
            type: "string"
          },
          sn: {
            type: "string"
          }
        }
      },
      call: async ({params, authUser}): Promise<IUserAPI> => {
        let user = await User.findOne(authUser!.id);
        user.change(authUser!, params.pass, params.sn);
        User.update(user);
        return user.toAPI();
      }
    });
  }
  //[client]
  {
    api.addAPI<{ name: string, url: string }>({
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
      call: async ({params, authUser, ip, now}): Promise<IClientAPI> => {
        let client = Client.create(authUser!, params.name, params.url, now);
        await Client.insert(client);
        appLog("client/create", ip, "clients", client.id);
        return client.toAPI(authUser);
      }
    });

    api.addAPI<{
      id: string,
      name: string,
      url: string
    }>({
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
      call: async ({params, authUser, ip, now}): Promise<IClientAPI> => {
        let client = await Client.findOne(new ObjectID(params.id));
        client.changeData(authUser!, params.name, params.url, now);
        await Client.update(client);
        appLog("client/update", ip, "clients", client.id);
        return client.toAPI(authUser);
      }
    });

    api.addAPI<{ id: string }>({
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
      call: async ({params, authUser}): Promise<IClientAPI> => {
        let client = await Client.findOne(new ObjectID(params.id));
        return client.toAPI(authUser);
      }
    });

    api.addAPI<{ ids: string[] }>({
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
      call: async ({params, authUser}): Promise<IClientAPI[]> => {
        let clients = await Client.findIn(params.ids.map(id => new ObjectID(id)));
        return clients.map(c => c.toAPI(authUser));
      }
    });

    api.addAPI<null>({
      url: "/client/find/all",

      isAuthUser: true,
      isAuthToken: false,
      schema: {
        type: "null",
      },
      call: async ({authUser}): Promise<IClientAPI[]> => {
        let clients = await Client.findAll(authUser!);
        return clients.map(c => c.toAPI(authUser));
      }
    });
  }

  api.addAPI<null>({
    url: "/user/auth",

    isAuthUser: true,
    isAuthToken: false,
    schema: {
      type: "null",
    },
    call: async (): Promise<null> => {
      return null;
    }
  });

  api.run();

  //cron
  User.cron();
  Topic.cron();
})();
