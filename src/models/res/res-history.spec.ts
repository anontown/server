import * as Im from "immutable";
import {
  History,
  IAuthToken,
  IResHistoryDB,
  ResHistory,
  TopicNormal,
  User,
} from "../../";

describe("ResHistory", () => {
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
    "body",
    new Date(600),
    "hash",
    "user");

  const resHistory = new ResHistory("history", "res", "topic", new Date(700), "user", Im.List(), 5, "hash", 1);

  describe("fromDB", () => {
    it("正常に作れるか", () => {
      const db: IResHistoryDB = {
        id: "id",
        type: "history",
        body: {
          topic: "topic",
          date: new Date(1000).toISOString(),
          user: "user",
          vote: [],
          lv: 5,
          hash: "hash",
          history: "history",
        },
      };
      const replyCount = 3;

      const res = ResHistory.fromDB(db, replyCount);

      expect(res.type).toBe(db.type);
      expect(res.history).toBe(db.body.history);
      expect(res.id).toBe(db.id);
      expect(res.topic).toBe(db.body.topic);
      expect(res.date).toEqual(new Date(db.body.date));
      expect(res.user).toBe(db.body.user);
      expect(res.vote).toEqual(Im.List(db.body.vote));
      expect(res.lv).toBe(db.body.lv);
      expect(res.hash).toBe(db.body.hash);
      expect(res.replyCount).toBe(replyCount);
    });
  });

  describe("create", () => {
    it("正常に作れるか", () => {
      const date = new Date(1000);
      const { res, topic: newTopic } = ResHistory.create(
        () => "res",
        topicNormal,
        user,
        token,
        history,
        date);

      expect(res.type).toBe("history");
      expect(res.history).toBe("history");
      expect(res.id).toBe("res");
      expect(res.topic).toBe("topic");
      expect(res.date).toEqual(date);
      expect(res.user).toBe("user");
      expect(res.vote).toEqual(Im.List());
      expect(res.lv).toBe(user.lv * 5);
      expect(res.hash).toBe(topicNormal.hash(date, user));
      expect(res.replyCount).toBe(0);

      expect(newTopic.update).toEqual(date);
      expect(newTopic.ageUpdate).toEqual(topicNormal.ageUpdate);
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
