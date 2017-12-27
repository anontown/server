import {
  ObjectIDGenerator,
  Msg,
  IMsgDB,
  AtError
} from '../../';

describe("Msg", () => {
  {
    const msg = Msg.fromDB({
      id: ObjectIDGenerator.get(),
      body: {
        receiver: "user",
        body: "あいうえお",
        date: new Date().toISOString()
      }
    });

    const receiverNullMsg = Msg.fromDB({
      id: ObjectIDGenerator.get(),
      body: {
        receiver: null,
        body: "あいうえお",
        date: new Date().toISOString()
      }
    });

    describe("#toDB", () => {
      it("正常に変換出来るか", () => {
        let db = msg.toDB();

        expect(db.id).toBe(msg.id);
        expect(db.body.receiver).toBe(msg.receiver);
        expect(db.body.body).toBe(msg.body);
        expect(new Date(db.body.date).valueOf()).toBe(msg.date.valueOf());
      });
    });

    describe("#toAPI", () => {
      it("正常に変換出来るか", () => {
        let api = msg.toAPI({
          id: "usid",
          key: "aaa",
          user: "user",
          type: "master"
        });

        expect(api.id).toBe(msg.id);
        expect(api.receiver).toBe(msg.receiver);
        expect(api.body).toBe(msg.body);
        expect(api.date.valueOf()).toBe(msg.date.toISOString());
      });

      it("receiverがnull", () => {
        let api = receiverNullMsg.toAPI({
          id: "usid",
          key: "aaa",
          user: "user",
          type: "master"
        });

        expect(api.receiver).toBeNull();
      });

      it("receiverがnot nullかつユーザーが違う時エラーになるか", () => {
        expect(() => {
          msg.toAPI({
            id: "usid",
            key: "aaa",
            user: "other",
            type: "master"
          })
        }).toThrow(AtError);
      });
    });
  }

  describe("fromDB", () => {
    it(`正常に作成できるか`, () => {
      const db: IMsgDB = {
        id: ObjectIDGenerator.get(),
        body: {
          receiver: ObjectIDGenerator.get(),
          body: "a",
          date: new Date().toISOString()
        }
      };

      const msg = Msg.fromDB(db);

      expect(msg.id).toBe(db.id);
      expect(msg.receiver).toBe(db.body.receiver);
      expect(msg.body).toBe(db.body.body);
      expect(msg.date.valueOf()).toBe(new Date(db.body.date).valueOf());
    });
  });

  describe("create", () => {
    it('正常に生成できるか', () => {
      Msg.create(ObjectIDGenerator, null, 'hoge', new Date());
    });
  });
});