import {
  Storage,
  ObjectIDGenerator,
  IAuthTokenGeneral,
  IAuthTokenMaster,
} from "../../";
import { ObjectID } from "mongodb";

describe("Storage", () => {
  const cleintID = ObjectIDGenerator();
  const userID = ObjectIDGenerator();
  const storageID = ObjectIDGenerator();
  const authMasterID = ObjectIDGenerator();
  const authGeneralID = ObjectIDGenerator();

  const storage = new Storage(storageID,
    cleintID,
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
    client: cleintID
  };

  describe("fromDB", () => {
    it("正常に変換出来るか", () => {
      expect(Storage.fromDB({
        _id: new ObjectID(storageID),
        client: new ObjectID(cleintID),
        user: new ObjectID(userID),
        key: "key",
        value: "value"
      })).toEqual(storage);

      expect(Storage.fromDB({
        _id: new ObjectID(storageID),
        client: null,
        user: new ObjectID(userID),
        key: "key",
        value: "value"
      })).toEqual(storage.copy({ client: null }));
    });
  });

  describe("toAPI", () => {
    it("通常トークンで正常に変換出来るか", () => {
      expect(storage.toAPI(authGeneral)).toEqual("value");
    });

    it("マスタートークンで正常に変換出来るか", () => {
      expect(storage.copy({ client: null }).toAPI(authMaster)).toEqual("value");
    });

    it("ユーザーが違う時エラーになるか", () => {
      expect(() => {
        storage.toAPI({ ...authMaster, user: ObjectIDGenerator() })
      });
    });
  });
});