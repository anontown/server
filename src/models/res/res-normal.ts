import * as Im from "immutable";
import {
  AtError,
  IAuthToken,
  ResNormal,
  IResNormalDB,
  IVote,
  ResBase,
  User,
  IResNormalAPI,
} from "../../";

describe("ResNormal", () => {
  describe("fromDB", () => {
    it("正常に変換出来るか", () => {
      const db: IResNormalDB = {
        id: "res",
        type: "normal",
        body: {
          topic: "topic",
          date: new Date().toISOString(),
          user: "user",
          vote: [],
          lv: 10,
          hash: "hash",
          name: "name",
          body: "body",
          reply: {
            res: "replyres",
            user: "replyuser"
          },
          deleteFlag: "active",
          profile: "profile",
          age: true,
        }
      };

      const replyCount = 2;
      const res = ResNormal.fromDB(db, replyCount);

      expect(res.name).toBe(db.body.name);
      expect(res.body).toBe(db.body.body);
      expect(res.reply).toBe(db.body.reply);
      expect(res.deleteFlag).toBe(db.body.deleteFlag);
      expect(res.profile).toBe(db.body.profile);
      expect(res.age).toBe(db.body.age);
      expect(res.id).toBe(db.id);
      expect(res.topic).toBe(db.body.topic);
      expect(res.date).toEqual(new Date(db.body.date));
      expect(res.user).toBe(db.body.user);
      expect(res.vote).toEqual(db.body.vote);
      expect(res.lv).toBe(db.body.lv);
      expect(res.hash).toBe(db.body.hash);
      expect(res.replyCount).toBe(replyCount);
    });
  });
});