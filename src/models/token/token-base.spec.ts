import * as Im from "immutable";
import Copyable from "ts-copyable";
import {
  AtError,
  IAuthToken,
  TokenBase,
  User,
  ITokenBaseDB,
  ITokenBaseAPI,
  ObjectIDGenerator
} from "../../";
import { applyMixins } from "../../utils";
import { ObjectID } from "mongodb";

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