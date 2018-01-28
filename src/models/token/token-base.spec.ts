import * as Im from "immutable";
import Copyable from "ts-copyable";
import {
  AtError,
  IAuthToken,
  TokenBase,
  User,
  ITokenBaseDB,
  ITokenBaseAPI
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
});