import * as Im from "immutable";
import {
  History,
  TopicNormal,
  User,
} from "../../";

describe("History", () => {
  describe("fromDB", () => {
    it("正常に変換出来るか", () => {
      expect(History.fromDB({
        id: "history",
        body: {
          topic: "topic",
          title: "title",
          tags: ["x"],
          text: "text",
          date: new Date(0).toISOString(),
          hash: "hash",
          user: "user",
        },
      })).toEqual(new History("history",
        "topic",
        "title",
        Im.List(["x"]),
        "text",
        new Date(0),
        "hash",
        "user"));
    });
  });

  describe("create", () => {
    it("正常に作れるか", () => {
      const topic = new TopicNormal("topic",
        "title",
        Im.List(),
        "text",
        new Date(100),
        new Date(0),
        10,
        new Date(50),
        true);

      const user = new User("user",
        "sn",
        "pass",
        5,
        {
          last: new Date(200),
          m10: 0,
          m30: 0,
          h1: 0,
          h6: 0,
          h12: 0,
          d1: 0,
        },
        new Date(80),
        new Date(20),
        0,
        new Date(90));

      expect(History.create(() => "history",
        topic,
        new Date(300),
        "hash",
        user)).toEqual(new History("history",
          "topic",
          "title",
          Im.List(),
          "text",
          new Date(300),
          "hash",
          "user"));
    });
  });

  const history = History.fromDB({
    id: "history",
    body: {
      topic: "topic",
      title: "title",
      tags: ["x"],
      text: "text",
      date: new Date(0).toISOString(),
      hash: "hash",
      user: "user",
    },
  });
  describe("#toDB", () => {
    it("正常に変換できるか", () => {
      expect(history.toDB()).toEqual({
        id: "history",
        body: {
          topic: "topic",
          title: "title",
          tags: ["x"],
          text: "text",
          date: new Date(0).toISOString(),
          hash: "hash",
          user: "user",
        },
      });
    });
  });

  describe("#toAPI", () => {
    it("正常に変換できるか(tokenがnull)", () => {
      expect(history.toAPI(null)).toEqual({
        id: "history",
        topicID: "topic",
        title: "title",
        tags: ["x"],
        text: "text",
        date: new Date(0).toISOString(),
        hash: "hash",
        self: null,
      });
    });

    it("正常に変換できるか(tokenが投稿ユーザー)", () => {
      expect(history.toAPI({
        id: "token",
        key: "key",
        user: "user",
        type: "master",
      })).toEqual({
        id: "history",
        topicID: "topic",
        title: "title",
        tags: ["x"],
        text: "text",
        date: new Date(0).toISOString(),
        hash: "hash",
        self: true,
      });
    });

    it("正常に変換できるか(tokenが別ユーザー)", () => {
      expect(history.toAPI({
        id: "token",
        key: "key",
        user: "user2",
        type: "master",
      })).toEqual({
        id: "history",
        topicID: "topic",
        title: "title",
        tags: ["x"],
        text: "text",
        date: new Date(0).toISOString(),
        hash: "hash",
        self: false,
      });
    });
  });
});
