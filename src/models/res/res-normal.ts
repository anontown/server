import * as Im from "immutable";
import {
  AtError,
  IAuthToken,
  ResNormal,
  IResNormalDB,
  IVote,
  ResBase,
  User,
  IResNormalAPI,
  TopicNormal,
  Profile
} from "../../";

describe("ResNormal", () => {
  const resNormal = new ResNormal(
    "name",
    "body",
    {
      res: "replyres",
      user: "replyuser"
    },
    "active",
    "profile",
    true,
    "res",
    "topic",
    new Date(),
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
    new Date(),
    new Date(),
    10,
    new Date(),
    true
  );

  const user = new User(
    "user",
    "sn",
    "pass",
    1,
    {
      last: new Date(),
      m10: 0,
      m30: 0,
      h1: 0,
      h6: 0,
      h12: 0,
      d1: 0,
    },
    new Date(),
    new Date(),
    0,
    new Date());

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
    new Date(),
    new Date(),
    "sn");

  describe("fromDB", () => {
    it("正常に変換出来るか", () => {
      const db: IResNormalDB = {
        id: "res",
        type: "normal",
        body: {
          topic: "topic",
          date: new Date().toISOString(),
          user: "user",
          vote: [],
          lv: 10,
          hash: "hash",
          name: "name",
          body: "body",
          reply: {
            res: "replyres",
            user: "replyuser"
          },
          deleteFlag: "active",
          profile: "profile",
          age: true,
        }
      };

      const replyCount = 2;
      const res = ResNormal.fromDB(db, replyCount);

      expect(res.name).toBe(db.body.name);
      expect(res.body).toBe(db.body.body);
      expect(res.reply).toBe(db.body.reply);
      expect(res.deleteFlag).toBe(db.body.deleteFlag);
      expect(res.profile).toBe(db.body.profile);
      expect(res.age).toBe(db.body.age);
      expect(res.id).toBe(db.id);
      expect(res.topic).toBe(db.body.topic);
      expect(res.date).toEqual(new Date(db.body.date));
      expect(res.user).toBe(db.body.user);
      expect(res.vote).toEqual(db.body.vote);
      expect(res.lv).toBe(db.body.lv);
      expect(res.hash).toBe(db.body.hash);
      expect(res.replyCount).toBe(replyCount);
    });
  });

  describe("create", () => {
    it("正常に作れるか", () => {
      const date = new Date();
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
        date);

      expect(res.name).toBeNull();
      expect(res.body).toBe("body");
      expect(res.reply).toBeNull();
      expect(res.deleteFlag).toBe("active");
      expect(res.profile).toBeNull();
      expect(res.age).toBe(true);
      expect(res.id).toBe("res");
      expect(res.topic).toBe("topic");
      expect(res.date).toEqual(date);
      expect(res.user).toBe("user");
      expect(res.vote).toEqual(Im.List());
      expect(res.lv).toBe(user.lv);
      expect(res.hash).toBe("hash");
      expect(res.replyCount).toBe(0);

      expect(newUser.resWait).toEqual({
        last: date,
        m10: 1,
        m30: 1,
        h1: 1,
        h6: 1,
        h12: 1,
        d1: 1,
      });

      expect(newTopic.update).toEqual(date);
      expect(newTopic.ageUpdate).toEqual(date);
    });

    it("replyがnullでない時正常に作れるか", () => {
      const date = new Date();
      const { res } = ResNormal.create(
        () => "res",
        topicNormal,
        user,
        token,
        null,
        "body",
        resNormal.copy({ id: "res2", user: "res2" }),
        null,
        true,
        date);

      expect(res.reply).toEqual({ id: "res2", user: "res2" });
    });

    it("profileがnullでない時正常に作れるか", () => {
      const date = new Date();
      const { res } = ResNormal.create(
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

      expect(res.profile).toEqual("profile");
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
          new Date());
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
          new Date());
      }).toThrow(AtError);

      it("nameが不正な時エラーになるか", () => {
        for (let name of ["", "x".repeat(51)]) {
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
              new Date());
          }).toThrow(AtError);
        }
      });

      for (let name of [null, "name"]) {
        it("bodyが不正な時エラーになるか。ただしname=" + name, () => {
          for (let body of ["", "x".repeat(5001)]) {
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
                new Date());
            }).toThrow(AtError);
          }
        });
      }
    });
  });
});