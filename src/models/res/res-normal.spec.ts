import * as Im from "immutable";
import {
  AtError,
  IAuthToken,
  Profile,
  ResNormal,
  TopicNormal,
  User,
} from "../../";

describe("ResNormal", () => {
  const resNormal = new ResNormal(
    "name",
    "body",
    {
      res: "replyres",
      user: "replyuser",
    },
    "active",
    "profile",
    true,
    "res",
    "topic",
    new Date(60),
    "user",
    Im.List(),
    5,
    "hash",
    1);

  const topicNormal = new TopicNormal(
    "topic",
    "title",
    Im.List(),
    "body",
    new Date(40),
    new Date(30),
    10,
    new Date(50),
    true,
  );

  const user = new User(
    "user",
    "sn",
    "pass",
    1,
    {
      last: new Date(20),
      m10: 0,
      m30: 0,
      h1: 0,
      h6: 0,
      h12: 0,
      d1: 0,
    },
    new Date(10),
    new Date(0),
    0,
    new Date(15));

  const token: IAuthToken = {
    id: "token",
    key: "key",
    user: "user",
    type: "master",
  };

  const profile = new Profile(
    "profile",
    "user",
    "name",
    "body",
    new Date(94),
    new Date(95),
    "sn");

  describe("fromDB", () => {
    it("正常に変換出来るか", () => {
      expect(ResNormal.fromDB({
        id: "res",
        type: "normal",
        body: {
          topic: "topic",
          date: new Date(100).toISOString(),
          user: "user",
          vote: [],
          lv: 10,
          hash: "hash",
          name: "name",
          body: "body",
          reply: {
            res: "replyres",
            user: "replyuser",
          },
          deleteFlag: "active",
          profile: "profile",
          age: true,
        },
      }, 2)).toEqual(new ResNormal("name",
        "body",
        {
          res: "replyres",
          user: "replyuser",
        },
        "active",
        "profile",
        true,
        "res",
        "topic",
        new Date(100),
        "user",
        Im.List(),
        10,
        "hash",
        2));
    });
  });

  describe("create", () => {
    it("正常に作れるか", () => {
      const { res, user: newUser, topic: newTopic } = ResNormal.create(
        () => "res",
        topicNormal,
        user,
        token,
        "name",
        "body",
        null,
        null,
        true,
        new Date(60000));

      expect(res).toEqual(new ResNormal("name",
        "body",
        null,
        "active",
        null,
        true,
        "res",
        "topic",
        new Date(60000),
        "user",
        Im.List(),
        5,
        topicNormal.hash(new Date(60000), user),
        0));

      expect(newUser).toEqual(user.copy({
        resWait: {
          last: new Date(60000),
          m10: 1,
          m30: 1,
          h1: 1,
          h6: 1,
          h12: 1,
          d1: 1,
        },
      }));

      expect(newTopic).toEqual(topicNormal.copy({ date: new Date(60000), update: new Date(60000) }));
    });

    it("replyがnullでない時正常に作れるか", () => {
      const { res, user: newUser, topic: newTopic } = ResNormal.create(
        () => "res",
        topicNormal,
        user,
        token,
        null,
        "body",
        resNormal.copy({ id: "res2", user: "res2" }),
        null,
        true,
        new Date(60000));

      expect(res).toEqual(new ResNormal(null,
        "body",
        { res: "res2", user: "res2" },
        "active",
        null,
        true,
        "res",
        "topic",
        new Date(60000),
        "user",
        Im.List(),
        5,
        topicNormal.hash(new Date(60000), user),
        0));

      expect(newUser).toEqual(user.copy({
        resWait: {
          last: new Date(60000),
          m10: 1,
          m30: 1,
          h1: 1,
          h6: 1,
          h12: 1,
          d1: 1,
        },
      }));

      expect(newTopic).toEqual(topicNormal.copy({ date: new Date(60000), update: new Date(60000) }));
    });

    it("profileがnullでない時正常に作れるか", () => {
      const date = new Date(60000);
      const { res, user: newUser, topic: newTopic } = ResNormal.create(
        () => "res",
        topicNormal,
        user,
        token,
        null,
        "body",
        null,
        profile,
        true,
        date);

      expect(res).toEqual(new ResNormal(null,
        "body",
        null,
        "active",
        "profile",
        true,
        "res",
        "topic",
        new Date(60000),
        "user",
        Im.List(),
        5,
        topicNormal.hash(new Date(60000), user),
        0));

      expect(newUser).toEqual(user.copy({
        resWait: {
          last: new Date(60000),
          m10: 1,
          m30: 1,
          h1: 1,
          h6: 1,
          h12: 1,
          d1: 1,
        },
      }));

      expect(newTopic).toEqual(topicNormal.copy({ date: new Date(60000), update: new Date(60000) }));
    });

    it("他のトピックへのリプライでエラーになるか", () => {
      expect(() => {
        ResNormal.create(
          () => "res",
          topicNormal,
          user,
          token,
          null,
          "body",
          resNormal.copy({ id: "res2", user: "res2", topic: "topic2" }),
          null,
          true,
          new Date(60000));
      }).toThrow(AtError);
    });

    it("他の人のプロフでエラーになるか", () => {
      expect(() => {
        ResNormal.create(
          () => "res",
          topicNormal,
          user,
          token,
          null,
          "body",
          null,
          profile.copy({ user: "user2" }),
          true,
          new Date(60000));
      }).toThrow(AtError);
    });

    it("nameが不正な時エラーになるか", () => {
      for (const name of ["", "x".repeat(51)]) {
        expect(() => {
          ResNormal.create(
            () => "res",
            topicNormal,
            user,
            token,
            name,
            "body",
            null,
            null,
            true,
            new Date(60000));
        }).toThrow(AtError);
      }
    });

    for (const name of [null, "name"]) {
      it("bodyが不正な時エラーになるか。ただしname=" + name, () => {
        for (const body of ["", "x".repeat(5001)]) {
          expect(() => {
            ResNormal.create(
              () => "res",
              topicNormal,
              user,
              token,
              name,
              body,
              null,
              null,
              true,
              new Date(60000));
          }).toThrow(AtError);
        }
      });
    }
  });

  describe("#toDB", () => {
    it("正常に変換出来るか", () => {
      const db = resNormal.toDB();
      expect(db).toEqual({
        id: resNormal.id,
        type: resNormal.type,
        body: {
          topic: resNormal.topic,
          date: resNormal.date.toISOString(),
          user: resNormal.user,
          vote: resNormal.vote.toArray(),
          lv: resNormal.lv,
          hash: resNormal.hash,
          name: resNormal.name,
          body: resNormal.body,
          reply: resNormal.reply,
          deleteFlag: resNormal.deleteFlag,
          profile: resNormal.profile,
          age: resNormal.age,
        },
      });
    });
    describe("#toAPI", () => {
      it("正常に変換出来るか", () => {
        const api = resNormal.toAPI(null);
        expect(api).toEqual({
          ...resNormal.toBaseAPI(null),
          name: resNormal.name,
          body: resNormal.body,
          reply: "replyres",
          profile: resNormal.profile,
          isReply: null,
        });
      });

      it("自分に対するリプライ", () => {
        const api = resNormal.toAPI({ ...token, user: "replyuser" });
        if (api.type === "normal") {
          expect(api.isReply).toBe(true);
        } else {
          throw new Error();
        }
      });

      it("他人に対するリプライ", () => {
        const api = resNormal.toAPI({ ...token, user: "user2" });
        if (api.type === "normal") {
          expect(api.isReply).toBe(false);
        } else {
          throw new Error();
        }
      });

      it("自主削除されたレス", () => {
        const api = resNormal.copy({ deleteFlag: "self" }).toAPI(null);
        expect(api).toEqual({
          ...resNormal.toBaseAPI(null),
          type: "delete",
          flag: "self",
        });
      });

      it("強制削除されたレス", () => {
        const api = resNormal.copy({ deleteFlag: "freeze" }).toAPI(null);
        expect(api).toEqual({
          ...resNormal.toBaseAPI(null),
          type: "delete",
          flag: "freeze",
        });
      });
    });

    describe("#del", () => {
      it("正常に削除出来るか", () => {
        const { res: newRes, resUser: newUser } = resNormal.del(user.copy({ lv: 3 }), token);
        expect(newUser).toEqual(user.copy({ lv: 2 }));
        expect(newRes).toEqual(resNormal.copy({ deleteFlag: "self" }));
      });

      it("人のレスを削除しようとするとエラーになるか", () => {
        expect(() => {
          resNormal.del(user.copy({ id: "user2" }), { ...token, user: "user2" });
        }).toThrow(AtError);
      });

      it("削除済みのレスを削除しようとするとエラーになるか", () => {
        expect(() => {
          resNormal.copy({ deleteFlag: "self" }).del(user, token);
        }).toThrow(AtError);
      });
    });
  });
});
