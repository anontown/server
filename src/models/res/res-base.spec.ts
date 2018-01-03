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

  const user = new User(
    "user",
    "sn",
    "pass",
    1,
    {
      last: new Date(),
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
    new Date())

  const res = new ResBaseTest("id",
    "topic",
    new Date(),
    "user",
    Im.List(),
    1,
    "hash",
    10);

  describe("#v", () => {
    it("正常に投票出来るか", () => {
      const voteUser = user.copy({ id: "voteuser", lv: 100 });
      const { res: newRes, resUser: newResUser } = res.v(user,
        voteUser,
        "uv",
        {
          id: voteUser.id,
          key: "aaaaa",
          user: "user2",
          type: "master",
        });

      expect(newRes.vote).toEqual(Im.List([{ user: voteUser.id, value: 2 }]));
      expect(newResUser.lv).toBe(3);

      const voteUser2 = voteUser.copy({ id: "voteuser2", lv: 50 });
      const { res: newNewRes, resUser: newNewResUser } = newRes.v(newResUser,
        voteUser2,
        "dv",
        {
          id: voteUser2.id,
          key: "aaaaa",
          user: "user2",
          type: "master",
        });

      expect(newNewRes.vote).toEqual(Im.List([{ user: voteUser.id, value: 2 }, { user: voteUser2.id, value: -1 }]));
      expect(newNewResUser.lv).toBe(2);
    });

    it("自分に投票するとエラーになるか", () => {
      expect(() => {
        res.v(user,
          user,
          "uv",
          {
            id: user.id,
            key: "aaaaa",
            user: "user2",
            type: "master",
          });
      }).toThrow(AtError);
    });

    it("重複投票でエラーになるか", () => {
      const votedRes = res.copy({ vote: Im.List([{ user: "voteuser", value: 2 }]) });
      const voteUser = user.copy({ id: "voteuser" });

      expect(() => {
        votedRes.v(user, voteUser, "uv", {
          id: user.id,
          key: "aaaaa",
          user: "user2",
          type: "master",
        });
      }).toThrow(AtError);
    });
  });

});
