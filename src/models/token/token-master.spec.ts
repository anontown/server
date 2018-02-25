import { ObjectID } from "mongodb";
import {
  AtError,
  ITokenMasterDB,
  ObjectIDGenerator,
  TokenBase,
  TokenMaster,
} from "../../";

describe("TokenMaster", () => {
  const tokenID = ObjectIDGenerator();
  const userID = ObjectIDGenerator();
  const tokenMaster = new TokenMaster(tokenID, "key", userID, new Date(0));

  describe("fromDB", () => {
    it("正常に変換出来るか", () => {
      expect(TokenMaster.fromDB({
        _id: new ObjectID(tokenID),
        key: "key",
        type: "master",
        user: new ObjectID(userID),
        date: new Date(0),
      })).toEqual(tokenMaster);
    });
  });

  describe("create", () => {
    it("正常に生成出来るか", () => {
      expect(TokenMaster.create(() => "token", {
        id: "user",
        pass: "pass",
      },
        new Date(100),
        () => "key")).toEqual(new TokenMaster("token",
          TokenBase.createTokenKey(() => "key"),
          "user",
          new Date(100)));
    });
  });

  describe("toDB", () => {
    it("正常に変換出来るか", () => {
      const db = tokenMaster.toDB();
      expect(db).toEqual(tokenMaster.toBaseDB());
    });
  });

  describe("toAPI", () => {
    it("正常に変換出来るか", () => {
      const api = tokenMaster.toAPI();
      expect(api).toEqual(tokenMaster.toBaseAPI());
    });
  });

  describe("auth", () => {
    it("正常に認証出来るか", () => {
      const auth = tokenMaster.auth("key");
      expect(auth).toEqual({ id: tokenMaster.id, key: "key", user: tokenMaster.user, type: "master" });
    });

    it("keyが違う時エラーになるか", () => {
      expect(() => {
        tokenMaster.auth("key2");
      }).toThrow(AtError);
    });
  });
});
