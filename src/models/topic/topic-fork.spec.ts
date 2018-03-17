import * as Im from "immutable";
import {
  IAuthTokenMaster,
  ResFork,
  ResTopic,
  TopicFork,
  TopicNormal,
  User,
} from "../../";

describe("TopicFork", () => {
  const topicFork = new TopicFork("topic",
    "title",
    new Date(100),
    new Date(0),
    5,
    new Date(50),
    true,
    "parent");

  const user = new User("user",
    "sn",
    "pass",
    10,
    {
      last: new Date(0),
      m10: 0,
      m30: 0,
      h1: 0,
      h6: 0,
      h12: 0,
      d1: 0,
    },
    new Date(0),
    new Date(0),
    0,
    new Date(0));

  const auth: IAuthTokenMaster = {
    id: "token",
    key: "key",
    user: "user",
    type: "master",
  };

  const parent = new TopicNormal("parent",
    "title",
    Im.List(),
    "body",
    new Date(100),
    new Date(0),
    5,
    new Date(50),
    true);

  describe("fromDB", () => {
    it("正常に生成できるか", () => {
      expect(TopicFork.fromDB({
        id: "topic",
        body: {
          type: "fork",
          title: "title",
          update: new Date(100).toISOString(),
          date: new Date(0).toISOString(),
          ageUpdate: new Date(50).toISOString(),
          active: true,
          parent: "parent",
        },
      }, 5)).toEqual(topicFork);
    });
  });

  describe("create", () => {
    it("正常に生成できるか", () => {
      expect(TopicFork.create(() => "id",
        "title",
        parent,
        user,
        auth,
        new Date(24 * 60 * 60 * 1000))).toEqual({
          topic: topicFork.copy({
            id: "id",
            date: new Date(24 * 60 * 60 * 1000),
            update: new Date(24 * 60 * 60 * 1000),
            ageUpdate: new Date(24 * 60 * 60 * 1000),
            resCount: 1,
          }),
          res: new ResTopic("id",
            "id",
            new Date(24 * 60 * 60 * 1000),
            "user",
            Im.List(),
            50,
            topicFork.copy({
              id: "id",
            }).hash(new Date(24 * 60 * 60 * 1000), user),
            0),
          resParent: new ResFork("id",
            "id",
            "parent",
            new Date(24 * 60 * 60 * 1000),
            "user",
            Im.List(),
            50,
            parent.hash(new Date(24 * 60 * 60 * 1000), user),
            0),
          user: user.copy({
            lastOneTopic: new Date(24 * 60 * 60 * 1000),
          }),
          parent: parent.copy({
            update: new Date(24 * 60 * 60 * 1000),
          }),
        });
    });
  });

  describe("toDB", () => {
    it("正常に生成出来るか", () => {
      expect(topicFork.toDB()).toEqual(topicFork.toBaseDB({
        parent: "parent",
      }));
    });
  });

  describe("toAPI", () => {
    it("正常に生成出来るか", () => {
      expect(topicFork.toAPI()).toEqual({
        ...topicFork.toBaseAPI(),
        parent: "parent",
      });
    });
  });
});
