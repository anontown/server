import {
  User,
  ObjectIDGenerator,
  hash,
  Config,
  AtError
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

  describe("create", () => {
    it("正常に作れるか", () => {
      expect(User.create(() => userID, "scn", "pass", new Date(0)))
        .toEqual(user.copy({
          resWait: {
            last: new Date(0),
            m10: 0,
            m30: 0,
            h1: 0,
            h6: 0,
            h12: 0,
            d1: 0,
          },
          lastTopic: new Date(0),
          lastOneTopic: new Date(0)
        }));
    });

    it("パスワードが不正な時エラーになるか", () => {
      expect(() => {
        User.create(() => userID, "scn", "x", new Date(0))
      }).toThrow(AtError);

      expect(() => {
        User.create(() => userID, "scn", "x".repeat(51), new Date(0))
      }).toThrow(AtError);

      expect(() => {
        User.create(() => userID, "scn", "あ", new Date(0))
      }).toThrow(AtError);
    });

    it("スクリーンネームが不正な時エラーになるか", () => {
      expect(() => {
        User.create(() => userID, "x", "pass", new Date(0))
      }).toThrow(AtError);

      expect(() => {
        User.create(() => userID, "x".repeat(21), "pass", new Date(0))
      }).toThrow(AtError);

      expect(() => {
        User.create(() => userID, "あ", "pass", new Date(0))
      }).toThrow(AtError);
    });
  });

  describe("toDB", () => {
    it("正常に変換出来るか", () => {
      expect(user.toDB()).toEqual({
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
      });
    });
  });

  describe("toAPI", () => {
    it("正常に変換出来るか", () => {
      expect(user.toAPI()).toEqual({
        id: userID,
        sn: "scn"
      });
    });
  });

  describe("change", () => {
    const authUser = {
      id: userID,
      pass: hash("pass" + Config.salt.pass)
    };

    it("正常に変更出来るか", () => {
      expect(user.change(authUser, "pass2", "scn2")).toEqual(user.copy({
        sn: "scn2",
        pass: hash("pass2" + Config.salt.pass)
      }));
    });

    it("パスワードが不正な時エラーになるか", () => {
      expect(() => {
        user.change(authUser, "x", "scn");
      }).toThrow(AtError);

      expect(() => {
        user.change(authUser, "x".repeat(51), "scn");
      }).toThrow(AtError);

      expect(() => {
        user.change(authUser, "あ", "scn");
      }).toThrow(AtError);
    });

    it("スクリーンネームが不正な時エラーになるか", () => {
      expect(() => {
        user.change(authUser, "pass", "x");
      }).toThrow(AtError);

      expect(() => {
        user.change(authUser, "pass", "x".repeat(21));
      }).toThrow(AtError);

      expect(() => {
        user.change(authUser, "pass", "あ");
      }).toThrow(AtError);
    });
  });

  describe("auth", () => {
    it("正常に認証出来るか", () => {
      expect(user.auth("pass")).toEqual({
        id: userID,
        pass: hash("pass" + Config.salt.pass)
      });
    });

    it("パスワードが違う時エラーになるか", () => {
      expect(() => {
        user.auth("pass2");
      }).toThrow(AtError);
    });
  });
});
