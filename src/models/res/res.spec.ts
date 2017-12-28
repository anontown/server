import {
  IAuthToken,
  IVote,
  ResBase,
  User
} from "../../";
import { ObjectID } from "mongodb";

describe("Res", () => {
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
          lv: 10,
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
        expect(res.voteValue).toBe(5);
      });
    });
    describe("#uv", () => {
      it("正常に投票出来るか", () => {
        const resUserID = new ObjectID();
        const voteUserID = new ObjectID();
        const date = new Date();
        const vote: IVote[] = [];
        const res = new ResBaseTest("id",
          "topic",
          date,
          resUserID.toHexString(),
          vote,
          1,
          "hash",
          "normal",
          10);
        const resUser = User.fromDB({
          _id: resUserID,
          sn: "sn1",
          pass: "pass",
          lv: 2,
          resWait: {
            last: new Date(),
            m10: 0,
            m30: 0,
            h1: 0,
            h6: 0,
            h12: 0,
            d1: 0,
          },
          lastTopic: new Date(),
          date: new Date(),
          point: 1,
          lastOneTopic: new Date()
        });
        res.uv(resUser,
          User.fromDB({
            _id: voteUserID,
            sn: "sn1",
            pass: "pass",
            lv: 2,
            resWait: {
              last: new Date(),
              m10: 0,
              m30: 0,
              h1: 0,
              h6: 0,
              h12: 0,
              d1: 0,
            },
            lastTopic: new Date(),
            date: new Date(),
            point: 1,
            lastOneTopic: new Date()
          }),
          {
            id: voteUserID.toHexString(),
            key: "aaaaa",
            user: "user2",
            type: "master"
          });
        expect(res.vote).toEqual([{ user: voteUserID.toHexString(), value: 2, lv: 2 }]);
        expect(resUser.lv)
      });
    });
  });
});
