import { none, some } from "fp-ts/lib/Option";
import { ObjectID } from "mongodb";
import {
  AtError,
  IAuthTokenGeneral,
  IAuthTokenMaster,
  ObjectIDGenerator,
  Storage,
} from "../../";

describe("Storage", () => {
  const cleintID = ObjectIDGenerator();
  const userID = ObjectIDGenerator();
  const authMasterID = ObjectIDGenerator();
  const authGeneralID = ObjectIDGenerator();

  const storage = new Storage(some(cleintID),
    userID,
    "key",
    "value");

  const authMaster: IAuthTokenMaster = {
    id: authMasterID,
    key: "tokenkey",
    user: userID,
    type: "master",
  };

  const authGeneral: IAuthTokenGeneral = {
    id: authGeneralID,
    key: "tokenkey",
    user: userID,
    type: "general",
    client: cleintID,
  };

  describe("fromDB", () => {
    it("正常に変換出来るか", () => {
      expect(Storage.fromDB({
        client: new ObjectID(cleintID),
        user: new ObjectID(userID),
        key: "key",
        value: "value",
      })).toEqual(storage);

      expect(Storage.fromDB({
        client: null,
        user: new ObjectID(userID),
        key: "key",
        value: "value",
      })).toEqual(storage.copy({ client: none }));
    });
  });

  describe("toAPI", () => {
    it("通常トークンで正常に変換出来るか", () => {
      expect(storage.toAPI(authGeneral)).toEqual("value");
    });

    it("マスタートークンで正常に変換出来るか", () => {
      expect(storage.copy({ client: none }).toAPI(authMaster)).toEqual("value");
    });

    it("ユーザーが違う時エラーになるか", () => {
      expect(() => {
        storage.toAPI({ ...authMaster, user: ObjectIDGenerator() });
      }).toThrow(AtError);
    });

    it("マスターIDでクライアントがnullでないものを変換するときエラーになるか", () => {
      expect(() => {
        storage.toAPI(authMaster);
      }).toThrow(AtError);
    });

    it("通常IDでクライアントがnullのものを変換する時エラーになるか", () => {
      expect(() => {
        storage.copy({ client: none }).toAPI(authGeneral);
      }).toThrow(AtError);
    });
  });

  describe("create", () => {
    it("正常に作成出来るか", () => {
      expect(Storage.create(authGeneral, "key", "value")).toEqual(storage);
      expect(Storage.create(authMaster, "key", "value")).toEqual(storage.copy({ client: none }));
    });

    it("keyが不正な時エラーになるか", () => {
      for (const key of ["", "x".repeat(101)]) {
        expect(() => {
          Storage.create(authGeneral, key, "value");
        }).toThrow(AtError);
      }
    });

    it("valueが不正な時エラーになるか", () => {
      expect(() => {
        Storage.create(authGeneral, "key", "x".repeat(100001));
      }).toThrow(AtError);
    });
  });

  describe("toDB", () => {
    it("正常に変換出来るか", () => {
      expect(storage.toDB()).toEqual({
        client: new ObjectID(cleintID),
        user: new ObjectID(userID),
        key: "key",
        value: "value",
      });

      expect(storage.copy({ client: none }).toDB()).toEqual({
        client: null,
        user: new ObjectID(userID),
        key: "key",
        value: "value",
      });
    });
  });
});
