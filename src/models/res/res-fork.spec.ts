import { some } from "fp-ts/lib/Option";
import * as Im from "immutable";
import {
  IAuthToken,
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
    "text",
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
      expect(ResFork.fromDB({
        id: "id",
        body: {
          type: "fork",
          topic: "topic",
          date: new Date(400).toISOString(),
          user: "user",
          votes: [],
          lv: 5,
          hash: "hash",
          fork: "topicfork",
        },
      }, 3)).toEqual(new ResFork("topicfork",
        "id",
        "topic",
        new Date(400),
        "user",
        Im.List(),
        5,
        "hash",
        3));
    });
  });

  describe("create", () => {
    it("正常に作れるか", () => {
      const { res, topic } = ResFork.create(() => "res",
        topicNormal,
        user,
        token,
        topicFork,
        new Date(90));
      expect(res).toEqual(new ResFork("topicfork",
        "res",
        "topic",
        new Date(90),
        "user",
        Im.List(),
        5,
        topicNormal.hash(new Date(90), user),
        0,
      ));
      expect(topic).toEqual(topicNormal.copy({ update: new Date(90) }));
    });
  });

  describe("toDB", () => {
    it("正常に変換出来るか", () => {
      expect(resFork.toDB()).toEqual(resFork.toBaseDB({ fork: "topicfork" }));
    });
  });

  describe("toAPI", () => {
    it("正常に変換出来るか", () => {
      expect(resFork.toAPI(some(token))).toEqual({ ...resFork.toBaseAPI(some(token)), forkID: "topicfork" });
    });
  });
});
