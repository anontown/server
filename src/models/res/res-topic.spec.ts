import * as Im from "immutable";
import {
  ResTopic,
  IResTopicDB,
  TopicOne,
  User,
  IAuthToken
} from "../../";

describe("ResTopic", () => {
  const topicOne = new TopicOne(
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

  const resTopic = new ResTopic("res",
    "topic",
    new Date(),
    "user",
    Im.List(),
    5,
    "hash",
    10);

  describe("fromDB", () => {
    it("正常に作れるか", () => {
      const db: IResTopicDB = {
        id: "id",
        type: "topic",
        body: {
          topic: "topic",
          date: new Date().toISOString(),
          user: "user",
          vote: [],
          lv: 5,
          hash: "hash",
        }
      };
      const replyCount = 3;

      const res = ResTopic.fromDB(db, replyCount);

      expect(res.type).toBe(db.type);
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
      const date = new Date();
      const { res, topic } = ResTopic.create(() => "res", topicOne, user, token, date);

      expect(res.type).toBe("topic");
      expect(res.id).toBe("res");
      expect(res.topic).toBe("topic");
      expect(res.date).toEqual(date);
      expect(res.user).toBe("user");
      expect(res.vote).toEqual(Im.List());
      expect(res.lv).toBe(5);
      expect(res.hash).toBe(topicOne.hash(date, user));
      expect(res.replyCount).toBe(0);

      expect(topic.update).toEqual(date);
    });
  });

  describe("toDB", () => {
    it("正常に変換出来るか", () => {
      expect(resTopic.toDB()).toEqual(resTopic.toBaseDB({}));
    });
  });
});