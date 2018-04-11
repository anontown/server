import * as Im from "immutable";
import {
  History,
  IAuthToken,
  ResHistory,
  TopicNormal,
  User,
} from "../../";

describe("ResHistory", () => {
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

  const user = new User(
    "user",
    "sn",
    "pass",
    1,
    {
      last: new Date(300),
      m10: 0,
      m30: 0,
      h1: 0,
      h6: 0,
      h12: 0,
      d1: 0,
    },
    new Date(240),
    new Date(200),
    0,
    new Date(260));

  const token: IAuthToken = {
    id: "token",
    key: "key",
    user: "user",
    type: "master",
  };

  const history = new History(
    "history",
    "topic",
    "title",
    Im.List(),
    "text",
    new Date(600),
    "hash",
    "user");

  const resHistory = new ResHistory("history", "res", "topic", new Date(700), "user", Im.List(), 5, "hash", 1);

  describe("fromDB", () => {
    it("正常に作れるか", () => {
      expect(ResHistory.fromDB({
        id: "id",
        body: {
          type: "history",
          topic: "topic",
          date: new Date(1000).toISOString(),
          user: "user",
          votes: [],
          lv: 5,
          hash: "hash",
          history: "history",
        },
      }, 3)).toEqual(new ResHistory("history",
        "id",
        "topic",
        new Date(1000),
        "user",
        Im.List(),
        5,
        "hash",
        3));
    });
  });

  describe("create", () => {
    it("正常に作れるか", () => {
      const { res, topic: newTopic } = ResHistory.create(
        () => "res",
        topicNormal,
        user,
        token,
        history,
        new Date(1000));

      expect(res).toEqual(new ResHistory("history",
        "res",
        "topic",
        new Date(1000),
        "user",
        Im.List(),
        5,
        topicNormal.hash(new Date(1000), user),
        0));

      expect(newTopic).toEqual(topicNormal.copy({ update: new Date(1000) }));
    });
  });

  describe("#toDB", () => {
    it("正常に変換できるか", () => {
      const db = resHistory.toDB();

      expect(db).toEqual(resHistory.toBaseDB({
        history: resHistory.history,
      }));
    });
  });

  describe("#toAPI", () => {
    it("正常に変換できるか", () => {
      const api = resHistory.toAPI(null);

      expect(api).toEqual({
        ...resHistory.toBaseAPI(null),
        history: resHistory.history,
      });
    });
  });
});
