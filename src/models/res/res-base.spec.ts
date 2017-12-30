import {
  IAuthToken,
  IVote,
  ResBase,
  User,
  ObjectIDGenerator,
  IResWait,
  AtError
} from "../../";
import { ObjectID } from "mongodb";

describe("ResBase", () => {
  class ResBaseTest extends ResBase<"normal"> {
    toDB() {
      return super.toBaseDB({});
    }

    toAPI(authToken: IAuthToken | null) {
      return super.toBaseAPI(authToken);
    }
  }

  describe("constructor", () => {
    it("正常に作れるか", () => {
      const date = new Date();
      const vote: IVote[] = [{
        user: "user",
        value: 5,
      }];
      const res = new ResBaseTest("id",
        "topic",
        date,
        "user",
        vote,
        1,
        "hash",
        "normal",
        10);

      expect(res.id).toBe("id");
      expect(res.topic).toBe("topic");
      expect(res.date).toBe(date);
      expect(res.user).toBe("user");
      expect(res.vote).toBe(vote);
      expect(res.lv).toBe(1);
      expect(res.hash).toBe("hash");
      expect(res.type).toBe("normal");
      expect(res.replyCount).toBe(10);
    });
  });

  describe("#v", () => {
    it("正常に投票出来るか", () => {
      const resWait: IResWait = {
        last: new Date(),
        m10: 0,
        m30: 0,
        h1: 0,
        h6: 0,
        h12: 0,
        d1: 0,
      };
      const resUserID = ObjectIDGenerator.get();
      const voteUserID = ObjectIDGenerator.get();
      const date = new Date();
      const vote: IVote[] = [];
      const res = new ResBaseTest("id",
        "topic",
        date,
        resUserID,
        vote,
        1,
        "hash",
        "normal",
        10);
      const resUser = User.fromDB({
        _id: new ObjectID(resUserID),
        sn: "sn1",
        pass: "pass",
        lv: 2,
        resWait,
        lastTopic: new Date(),
        date: new Date(),
        point: 1,
        lastOneTopic: new Date()
      });
      res.v(resUser,
        User.fromDB({
          _id: new ObjectID(voteUserID),
          sn: "sn1",
          pass: "pass",
          lv: 101,
          resWait,
          lastTopic: new Date(),
          date: new Date(),
          point: 1,
          lastOneTopic: new Date()
        }),
        "uv",
        {
          id: voteUserID,
          key: "aaaaa",
          user: "user2",
          type: "master"
        });

      expect(res.vote).toEqual([{ user: voteUserID, value: 2 }]);
      expect(resUser.lv).toBe(4);
    });

    it("自分に投票するとエラーになるか", () => {
      const resWait: IResWait = {
        last: new Date(),
        m10: 0,
        m30: 0,
        h1: 0,
        h6: 0,
        h12: 0,
        d1: 0,
      };
      const resUserID = ObjectIDGenerator.get();
      const date = new Date();
      const vote: IVote[] = [];
      const res = new ResBaseTest("id",
        "topic",
        date,
        resUserID,
        vote,
        1,
        "hash",
        "normal",
        10);
      const resUser = User.fromDB({
        _id: new ObjectID(resUserID),
        sn: "sn1",
        pass: "pass",
        lv: 2,
        resWait,
        lastTopic: new Date(),
        date: new Date(),
        point: 1,
        lastOneTopic: new Date()
      });
      expect(() => {
        res.v(resUser,
          resUser,
          "uv",
          {
            id: resUserID,
            key: "aaaaa",
            user: "user2",
            type: "master"
          });
      }).toThrow(AtError);
    });

    it("重複投票でエラーになるか", () => {
      const resWait: IResWait = {
        last: new Date(),
        m10: 0,
        m30: 0,
        h1: 0,
        h6: 0,
        h12: 0,
        d1: 0,
      };
      const resUserID = ObjectIDGenerator.get();
      const voteUserID = ObjectIDGenerator.get();
      const date = new Date();
      const vote: IVote[] = [];
      const res = new ResBaseTest("id",
        "topic",
        date,
        resUserID,
        vote,
        1,
        "hash",
        "normal",
        10);
      const resUser = User.fromDB({
        _id: new ObjectID(resUserID),
        sn: "sn1",
        pass: "pass",
        lv: 2,
        resWait,
        lastTopic: new Date(),
        date: new Date(),
        point: 1,
        lastOneTopic: new Date()
      });
      expect(() => {
        for (let i = 0; i < 2; i++) {
          res.v(resUser,
            User.fromDB({
              _id: new ObjectID(voteUserID),
              sn: "sn1",
              pass: "pass",
              lv: 101,
              resWait,
              lastTopic: new Date(),
              date: new Date(),
              point: 1,
              lastOneTopic: new Date()
            }),
            "uv",
            {
              id: voteUserID,
              key: "aaaaa",
              user: "user2",
              type: "master"
            });
        }
      }).toThrow(AtError);
    });
  });

});