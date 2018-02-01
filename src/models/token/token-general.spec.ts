import {
  TokenGeneral,
  ITokenGeneralDB,
  ObjectIDGenerator,
  TokenBase,
  AtError
} from "../../";
import { ObjectID } from "mongodb";

describe("TokenMaster", () => {
  describe("fromDB", () => {
    it("正常に変換出来るか", () => {
      const db: ITokenGeneralDB = {
        _id: new ObjectID(ObjectIDGenerator()),
        key: "key",
        type: "general",
        client: new ObjectID(ObjectIDGenerator()),
        user: new ObjectID(ObjectIDGenerator()),
        date: new Date(),
        req: []
      };
      const token = TokenGeneral.fromDB(db);

      expect(token.id).toBe(db._id.toHexString());
      expect(token.key).toBe(db.key);
      expect(token.type).toBe(db.type);
      expect(token.user).toBe(db.user.toHexString());
      expect(token.date).toEqual(db.date);
      expect(token.client).toBe(db.client.toHexString());
      expect(token.req).toEqual(db.req);
    });
  });
});