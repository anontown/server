import * as Im from "immutable";
import {
  IAuthToken,
  IResForkDB,
  ResFork,
  TopicFork,
  TopicNormal,
  User,
} from "../../";

describe("ResFork", () => {
  const topicNormal = new TopicNormal(
    "topic",
    "title",
    Im.List(),
    "body",
    new Date(100),
    new Date(0),
    10,
    new Date(50),
    true,
  );

  const topicFork = new TopicFork("topicfork",
    "title",
    new Date(0),
    new Date(100),
    30,
    new Date(50),
    true,
    "topic");

  const user = new User(
    "user",
    "sn",
    "pass",
    1,
    {
      last: new Date(0),
      m10: 0,
      m30: 0,
      h1: 0,
      h6: 0,
      h12: 0,
      d1: 0,
    },
    new Date(20),
    new Date(10),
    0,
    new Date(30));

  const token: IAuthToken = {
    id: "token",
    key: "key",
    user: "user",
    type: "master",
  };

  const resFork = new ResFork("topicfork",
    "res",
    "topic",
    new Date(500),
    "user",
    Im.List(),
    5,
    "hash",
    10);

  describe("fromDB", () => {
    it("正常に作れるか", () => {
      const db: IResForkDB = {
        id: "id",
        type: "fork",
        body: {
          topic: "topic",
          date: new Date(400).toISOString(),
          user: "user",
          vote: [],
          lv: 5,
          hash: "hash",
          fork: "topicfork",
        },
      };
      const replyCount = 3;

      const res = ResFork.fromDB(db, replyCount);

      expect(res.type).toBe(db.type);
      expect(res.id).toBe(db.id);
      expect(res.topic).toBe(db.body.topic);
      expect(res.date).toEqual(new Date(db.body.date));
      expect(res.user).toBe(db.body.user);
      expect(res.vote).toEqual(Im.List(db.body.vote));
      expect(res.lv).toBe(db.body.lv);
      expect(res.hash).toBe(db.body.hash);
      expect(res.replyCount).toBe(replyCount);
      expect(res.fork).toBe(db.body.fork);
    });
  });

  describe("create", () => {
    it("正常に作れるか", () => {
      const date = new Date(90);
      const { res, topic } = ResFork.create(() => "res", topicNormal, user, token, topicFork, date);

      expect(res.type).toBe("fork");
      expect(res.id).toBe("res");
      expect(res.topic).toBe("topic");
      expect(res.date).toEqual(date);
      expect(res.user).toBe("user");
      expect(res.vote).toEqual(Im.List());
      expect(res.lv).toBe(5);
      expect(res.hash).toBe(topicNormal.hash(date, user));
      expect(res.replyCount).toBe(0);
      expect(res.fork).toBe("topicfork");

      expect(topic.update).toEqual(date);
    });
  });

  describe("toDB", () => {
    it("正常に変換出来るか", () => {
      expect(resFork.toDB()).toEqual(resFork.toBaseDB({ fork: "topicfork" }));
    });
  });

  describe("toAPI", () => {
    it("正常に変換出来るか", () => {
      expect(resFork.toAPI(token)).toEqual({ ...resFork.toBaseAPI(token), fork: "topicfork" });
    });
  });
});
