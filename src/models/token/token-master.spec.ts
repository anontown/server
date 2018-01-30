import {
  TokenMaster,
  ITokenMasterDB,
  ObjectIDGenerator
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
});