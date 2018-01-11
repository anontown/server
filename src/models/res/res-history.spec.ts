import * as Im from "immutable";
import {
  ResHistory,
  IResHistoryDB,
  TopicNormal,
  User,
  IAuthToken,
  History
} from "../../";

describe("ResHistory", () => {
  const topicNormal = new TopicNormal(
    "topic",
    "title",
    Im.List(),
    "body",
    new Date(),
    new Date(),
    10,
    new Date(),
    true,
  );

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

  const history = new History(
    "history",
    "topic",
    "title",
    Im.List(),
    "body",
    new Date(),
    "hash",
    "user");

  describe("fromDB", () => {
    it("正常に作れるか", () => {
      const db: IResHistoryDB = {
        id: "id",
        type: "history",
        body: {
          topic: "topic",
          date: new Date().toISOString(),
          user: "user",
          vote: [],
          lv: 5,
          hash: "hash",
          history: "history"
        }
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
    const date = new Date();
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