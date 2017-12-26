import {
  ResBase,
  IAuthToken,
  IVote
} from '../../../scripts';
import * as assert from 'power-assert';

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

        assert(res.id === "id");
        assert(res.topic === "topic");
        assert(res.date === date);
        assert(res.user === "user");
        assert(res.vote === vote);
        assert(res.lv === 1);
        assert(res.hash === "hash");
        assert(res.type === "normal");
        assert(res.replyCount === 10);
      });
    });
  });
});