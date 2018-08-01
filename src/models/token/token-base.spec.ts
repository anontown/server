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

    toBaseAPI!: () => ITokenBaseAPI<"general">;
    toBaseDB!: () => ITokenBaseDB<"general">;

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
      expect(TokenBase.createTokenKey(() => "a")).not.toBe(TokenBase.createTokenKey(() => "b"));

    });
  });

  describe("toBaseDB", () => {
    it("正常に変換できるか", () => {
      const tokenID = ObjectIDGenerator();
      const userID = ObjectIDGenerator();
      const token = new TokenBaseTest(tokenID, "key", userID, new Date(0));
      expect(token.toBaseDB()).toEqual({
        _id: new ObjectID(tokenID),
        key: "key",
        user: new ObjectID(userID),
        date: new Date(0),
        type: "general",
      });
    });
  });

  describe("toBaseAPI", () => {
    const token = new TokenBaseTest("token", "key", "user", new Date(0));
    expect(token.toBaseAPI()).toEqual({
      id: "token",
      key: "key",
      date: new Date(0).toISOString(),
      type: "general",
    });
  });
});
