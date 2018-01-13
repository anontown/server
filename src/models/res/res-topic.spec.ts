import * as Im from "immutable";
import {
  ResTopic,
  IResTopicDB
} from "../../";

describe("ResTopic", () => {
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
});