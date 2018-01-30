import { ObjectID } from "mongodb";
import Copyable from "ts-copyable";
import {
  ITokenBaseAPI,
  ITokenBaseDB,
  ObjectIDGenerator,
  TokenBase,
} from "../../";
import { applyMixins } from "../../utils";

describe("TokenBase", () => {
  class TokenBaseTest extends Copyable<TokenBaseTest> implements TokenBase<"general", TokenBaseTest> {
    readonly type: "general" = "general";

    toBaseAPI: () => ITokenBaseAPI<"general">;
    toBaseDB: () => ITokenBaseDB<"general">;

    constructor(
      readonly id: string,
      readonly key: string,
      readonly user: string,
      readonly date: Date) {
      super(TokenBaseTest);
    }
  }
  applyMixins(TokenBaseTest, [TokenBase]);

  describe("createTokenKey", () => {
    it("正常に生成出来るか", () => {
      expect(TokenBase.createTokenKey(() => "key")).toBe("YwWX/R2CwHpqzfN5l6CU6ePSfmJxLQi8yL0vtOP+mCc");
    });
  });

  describe("toBaseDB", () => {
    it("正常に変換できるか", () => {
      const token = new TokenBaseTest(ObjectIDGenerator(), "key", ObjectIDGenerator(), new Date());
      expect(token.toBaseDB()).toEqual({
        _id: new ObjectID(token.id),
        key: token.key,
        user: new ObjectID(token.user),
        date: token.date,
        type: token.type,
      });
    });
  });

  describe("toBaseAPI", () => {
    const token = new TokenBaseTest("token", "key", "user", new Date());
    expect(token.toBaseAPI()).toEqual({
      id: token.id,
      key: token.key,
      user: token.user,
      date: token.date.toISOString(),
      type: token.type,
    });
  });
});
