import {
  ResBase,
  IAuthToken,
  IVote
} from '../../../scripts';

describe("Res", () => {
  describe("ResBase", () => {
    class ResBaseTest extends ResBase<"normal">{
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
        const vote: IVote[] = [];
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
  });
});