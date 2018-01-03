import * as Im from "immutable";
import { ObjectID } from "mongodb";
import Copyable from "ts-copyable";
import {
  AtError,
  IAuthToken,
  IResBaseAPI,
  IResBaseDB,
  IResWait,
  IVote,
  ObjectIDGenerator,
  ResBase,
  User,
} from "../../";
import { applyMixins } from "../../utils";

describe("ResBase", () => {
  class ResBaseTest extends Copyable<ResBaseTest> implements ResBase<"normal", ResBaseTest> {
    toBaseAPI: (authToken: IAuthToken | null) => IResBaseAPI<"normal">;
    toBaseDB: <Body extends object>(body: Body) => IResBaseDB<"normal", Body>;
    cv: (resUser: User, user: User, _authToken: IAuthToken) => { res: ResBaseTest, resUser: User };
    v: (resUser: User, user: User, type: "uv" | "dv", _authToken: IAuthToken) => { res: ResBaseTest, resUser: User };

    readonly type: "normal" = "normal";

    constructor(
      readonly id: string,
      readonly topic: string,
      readonly date: Date,
      readonly user: string,
      readonly vote: Im.List<IVote>,
      readonly lv: number,
      readonly hash: string,
      readonly replyCount: number) {
      super(ResBaseTest);
    }
  }
  applyMixins(ResBaseTest, [ResBase]);

  describe("constructor", () => {
    it("正常に作れるか", () => {
      const date = new Date();
      const vote: Im.List<IVote> = Im.List([{
        user: "user",
        value: 5,
      }]);

      const res = new ResBaseTest("id",
        "topic",
        date,
        "user",
        vote,
        1,
        "hash",
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
      const resUserID = ObjectIDGenerator();
      const voteUserID1 = ObjectIDGenerator();
      const voteUserID2 = ObjectIDGenerator();
      const date = new Date();
      const vote: Im.List<IVote> = Im.List();
      const res = new ResBaseTest("id",
        "topic",
        date,
        resUserID,
        vote,
        1,
        "hash",
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
        lastOneTopic: new Date(),
      });
      const { res: newRes, resUser: newResUser } = res.v(resUser,
        User.fromDB({
          _id: new ObjectID(voteUserID1),
          sn: "sn1",
          pass: "pass",
          lv: 101,
          resWait,
          lastTopic: new Date(),
          date: new Date(),
          point: 1,
          lastOneTopic: new Date(),
        }),
        "uv",
        {
          id: voteUserID1,
          key: "aaaaa",
          user: "user2",
          type: "master",
        });

      expect(newRes.vote).toEqual(Im.List([{ user: voteUserID1, value: 2 }]));
      expect(newResUser.lv).toBe(4);

      const { res: newNewRes, resUser: newNewResUser } = newRes.v(newResUser,
        User.fromDB({
          _id: new ObjectID(voteUserID2),
          sn: "sn1",
          pass: "pass",
          lv: 50,
          resWait,
          lastTopic: new Date(),
          date: new Date(),
          point: 1,
          lastOneTopic: new Date(),
        }),
        "dv",
        {
          id: voteUserID2,
          key: "aaaaa",
          user: "user2",
          type: "master",
        });

      expect(newNewRes.vote).toEqual(Im.List([{ user: voteUserID1, value: 2 }, { user: voteUserID2, value: -1 }]));
      expect(newNewResUser.lv).toBe(3);
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
      const resUserID = ObjectIDGenerator();
      const date = new Date();
      const vote: Im.List<IVote> = Im.List();
      const res = new ResBaseTest("id",
        "topic",
        date,
        resUserID,
        vote,
        1,
        "hash",
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
        lastOneTopic: new Date(),
      });
      expect(() => {
        res.v(resUser,
          resUser,
          "uv",
          {
            id: resUserID,
            key: "aaaaa",
            user: "user2",
            type: "master",
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
      const resUserID = ObjectIDGenerator();
      const voteUserID = ObjectIDGenerator();
      const date = new Date();
      const vote: Im.List<IVote> = Im.List();
      const res = new ResBaseTest("id",
        "topic",
        date,
        resUserID,
        vote,
        1,
        "hash",
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
        lastOneTopic: new Date(),
      });
      expect(() => {
        let nowRes = res;
        for (let i = 0; i < 2; i++) {
          nowRes = nowRes.v(resUser,
            User.fromDB({
              _id: new ObjectID(voteUserID),
              sn: "sn1",
              pass: "pass",
              lv: 101,
              resWait,
              lastTopic: new Date(),
              date: new Date(),
              point: 1,
              lastOneTopic: new Date(),
            }),
            "uv",
            {
              id: voteUserID,
              key: "aaaaa",
              user: "user2",
              type: "master",
            }).res;
        }
      }).toThrow(AtError);
    });
  });

});
