import {
  User,
  ObjectIDGenerator,
  hash,
  Config
} from "../../";
import { ObjectID } from "mongodb";

describe("User", () => {
  const userID = ObjectIDGenerator();
  const user = new User(userID,
    "scn",
    hash("pass" + Config.salt.pass),
    1,
    {
      last: new Date(300),
      m10: 0,
      m30: 0,
      h1: 0,
      h6: 0,
      h12: 0,
      d1: 0,
    },
    new Date(100),
    new Date(0),
    0,
    new Date(150)
  );

  describe("fromDB", () => {
    it("正常に変換出来るか", () => {
      expect(User.fromDB({
        _id: new ObjectID(userID),
        sn: "scn",
        pass: hash("pass" + Config.salt.pass),
        lv: 1,
        resWait: {
          last: new Date(300),
          m10: 0,
          m30: 0,
          h1: 0,
          h6: 0,
          h12: 0,
          d1: 0,
        },
        lastTopic: new Date(100),
        date: new Date(0),
        point: 0,
        lastOneTopic: new Date(150)
      })).toEqual(user);
    });
  });
});