import * as Im from "immutable";
import {
  ResHistory,
  IResHistoryDB
} from "../../";

describe("ResHistory", () => {
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
});