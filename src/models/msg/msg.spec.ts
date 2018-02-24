import {
  AtError,
  IMsgDB,
  Msg,
  ObjectIDGenerator,
  User,
} from "../../";

describe("Msg", () => {
  {
    const msg = Msg.fromDB({
      id: ObjectIDGenerator(),
      body: {
        receiver: "user",
        body: "あいうえお",
        date: new Date(0).toISOString(),
      },
    });

    const receiverNullMsg = Msg.fromDB({
      id: ObjectIDGenerator(),
      body: {
        receiver: null,
        body: "あいうえお",
        date: new Date(0).toISOString(),
      },
    });

    describe("#toDB", () => {
      it("正常に変換出来るか", () => {
        const db = msg.toDB();

        expect(db.id).toBe(msg.id);
        expect(db.body.receiver).toBe(msg.receiver);
        expect(db.body.body).toBe(msg.body);
        expect(db.body.date).toBe(msg.date.toISOString());
      });
    });

    describe("#toAPI", () => {
      it("正常に変換出来るか", () => {
        const api = msg.toAPI({
          id: "usid",
          key: "aaa",
          user: "user",
          type: "master",
        });

        expect(api.id).toBe(msg.id);
        expect(api.receiver).toBe(msg.receiver);
        expect(api.body).toBe(msg.body);
        expect(api.date).toBe(msg.date.toISOString());
      });

      it("receiverがnull", () => {
        const api = receiverNullMsg.toAPI({
          id: "usid",
          key: "aaa",
          user: "user",
          type: "master",
        });

        expect(api.receiver).toBeNull();
      });

      it("receiverがnot nullかつユーザーが違う時エラーになるか", () => {
        expect(() => {
          msg.toAPI({
            id: "usid",
            key: "aaa",
            user: "other",
            type: "master",
          });
        }).toThrow(AtError);
      });
    });
  }

  describe("fromDB", () => {
    it("正常に作成できるか", () => {
      const db: IMsgDB = {
        id: ObjectIDGenerator(),
        body: {
          receiver: ObjectIDGenerator(),
          body: "a",
          date: new Date(0).toISOString(),
        },
      };

      const msg = Msg.fromDB(db);

      expect(msg.id).toBe(db.id);
      expect(msg.receiver).toBe(db.body.receiver);
      expect(msg.body).toBe(db.body.body);
      expect(msg.date).toEqual(new Date(db.body.date));
    });
  });

  describe("create", () => {
    it("receiverがnullの時正常に生成できるか", () => {
      const date = new Date(0);
      const msg = Msg.create(() => "msg", null, "hoge", date);

      expect(msg.id).toBe("msg");
      expect(msg.receiver).toBeNull();
      expect(msg.body).toBe("hoge");
      expect(msg.date).toEqual(date);
    });

    it("receiverがnullでない時正常に生成出来るか", () => {
      const date = new Date(0);
      const user = new User(
        "user",
        "sn",
        "pass",
        1, {
          last: new Date(100),
          m10: 0,
          m30: 0,
          h1: 0,
          h6: 0,
          h12: 0,
          d1: 0,
        },
        new Date(200),
        new Date(20),
        0,
        new Date(250));
      const msg = Msg.create(() => "msg", user, "hoge", date);
      expect(msg.receiver).toBe("user");
    });
  });
});
