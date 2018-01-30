import {
  TokenMaster,
  ITokenMasterDB,
  ObjectIDGenerator,
  TokenBase
} from "../../";
import { ObjectID } from "mongodb";

describe("TokenMaster", () => {
  describe("fromDB", () => {
    it("正常に変換出来るか", () => {
      const db: ITokenMasterDB = {
        _id: new ObjectID(ObjectIDGenerator()),
        key: "key",
        type: "master",
        user: new ObjectID(ObjectIDGenerator()),
        date: new Date(),
      };
      const token = TokenMaster.fromDB(db);

      expect(token.id).toBe(db._id.toHexString());
      expect(token.key).toBe(db.key);
      expect(token.type).toBe(db.type);
      expect(token.user).toBe(db.user.toHexString());
      expect(token.date).toEqual(db.date);
    });
  });


  describe("create", () => {
    it("正常に生成出来るか", () => {
      const date = new Date();
      const token = TokenMaster.create(() => "token", {
        id: "user",
        pass: "pass"
      },
        date,
        () => "key");

      expect(token.id).toBe("token");
      expect(token.key).toBe(TokenBase.createTokenKey(() => "key"));
      expect(token.type).toBe("master");
      expect(token.user).toBe("user");
      expect(token.date).toEqual(date);
    });
  });
});