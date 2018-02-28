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

  describe("usePoint", () => {
    it("正常に使えるか", () => {
      expect(user.usePoint(1)).toEqual(user.copy({ point: 1 }));
      expect(user.copy({ lv: 5, point: 3 }).usePoint(1)).toEqual(user.copy({ lv: 5, point: 4 }));
    });

    it("レベル以上のポイントを使おうとするとエラーになるか", () => {
      expect(() => {
        user.usePoint(2);
      }).toThrow(AtError);
    });

    it("ポイントが足りない時エラーになるか", () => {
      expect(() => {
        user.copy({ lv: 5, point: 3 }).usePoint(3);
      }).toThrow(AtError);
    });
  });

  describe("changeLv", () => {
    it("正常に変更出来るか", () => {
      expect(user.changeLv(5)).toEqual(user.copy({ lv: 5 }));
    });

    it("1未満になるとき", () => {
      expect(user.changeLv(-10)).toEqual(user.copy({ lv: 1 }));
    });

    it("1000超過になるとき", () => {
      expect(user.changeLv(2000)).toEqual(user.copy({ lv: 1000 }));
    });
  });

  describe("changeLastRes", () => {
    it("正常に変更出来るか", () => {
      expect(user.copy({
        resWait: {
          last: new Date(0),
          m10: 4,
          m30: 9,
          h1: 14,
          h6: 19,
          h12: 34,
          d1: 49,
        }
      }).changeLastRes(new Date(60 * 1000))).toEqual(user.copy({
        resWait: {
          last: new Date(60 * 1000),
          m10: 5,
          m30: 10,
          h1: 15,
          h6: 20,
          h12: 35,
          d1: 50,
        }
      }));
    });

    it("30秒以上経ってない時エラーになるか", () => {
      expect(() => {
        user.changeLastRes(new Date(20 * 1000))
      }).toThrow(AtError);
    });

    describe("投稿数が多いとエラーになるか", () => {
      it("m10", () => {
        expect(() => {
          user.copy({
            resWait: {
              last: new Date(0),
              m10: 5,
              m30: 5,
              h1: 5,
              h6: 5,
              h12: 5,
              d1: 5,
            }
          }).changeLastRes(new Date(30 * 1000))
        }).toThrow(AtError);
      });

      it("m30", () => {
        expect(() => {
          user.copy({
            resWait: {
              last: new Date(0),
              m10: 0,
              m30: 10,
              h1: 10,
              h6: 10,
              h12: 10,
              d1: 10,
            }
          }).changeLastRes(new Date(30 * 1000))
        }).toThrow(AtError);
      });

      it("h1", () => {
        expect(() => {
          user.copy({
            resWait: {
              last: new Date(0),
              m10: 0,
              m30: 0,
              h1: 15,
              h6: 15,
              h12: 15,
              d1: 15,
            }
          }).changeLastRes(new Date(30 * 1000))
        }).toThrow(AtError);
      });

      it("h6", () => {
        expect(() => {
          user.copy({
            resWait: {
              last: new Date(0),
              m10: 0,
              m30: 0,
              h1: 0,
              h6: 20,
              h12: 20,
              d1: 20,
            }
          }).changeLastRes(new Date(30 * 1000))
        }).toThrow(AtError);
      });

      it("h12", () => {
        expect(() => {
          user.copy({
            resWait: {
              last: new Date(0),
              m10: 0,
              m30: 0,
              h1: 0,
              h6: 0,
              h12: 35,
              d1: 35,
            }
          }).changeLastRes(new Date(30 * 1000))
        }).toThrow(AtError);
      });

      it("d1", () => {
        expect(() => {
          user.copy({
            resWait: {
              last: new Date(0),
              m10: 0,
              m30: 0,
              h1: 0,
              h6: 0,
              h12: 0,
              d1: 50,
            }
          }).changeLastRes(new Date(30 * 1000))
        }).toThrow(AtError);
      });
    });
  });

  describe("changeLastTopic", () => {
    it("正常に変更出来るか", () => {
      expect(user.changeLastTopic(new Date(100000000)))
        .toEqual(user.copy({ lastTopic: new Date(100000000) }));
    });

    it("間隔が短いとエラーになるか", () => {
      expect(() => {
        user.changeLastTopic(new Date(10000));
      }).toThrow(AtError);
    });
  });

  describe("changeLastOneTopic", () => {
    it("正常に変更出来るか", () => {
      expect(user.changeLastOneTopic(new Date(100000000)))
        .toEqual(user.copy({ lastOneTopic: new Date(100000000) }));
    });

    it("間隔が短いとエラーになるか", () => {
      expect(() => {
        user.changeLastOneTopic(new Date(10000));
      }).toThrow(AtError);
    });
  });
});
