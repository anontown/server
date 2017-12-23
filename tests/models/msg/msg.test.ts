import {
  ObjectIDGenerator,
  Msg,
  IMsgDB
} from '../../../scripts';
import * as assert from 'power-assert';

describe("Msg", () => {
  {
    let msgs = [
      Msg.fromDB({
        id: ObjectIDGenerator.get(),
        body: {
          receiver: ObjectIDGenerator.get(),
          body: "あいうえお",
          date: new Date().toISOString()
        }
      }),
      Msg.fromDB({
        id: ObjectIDGenerator.get(),
        body: {
          receiver: null,
          body: "あいうえお",
          date: new Date().toISOString()
        }
      })
    ];

    describe("#toDB", () => {
      msgs.forEach(msg => {
        it(`receiverが${msg.receiver ? 'ObjectID' : 'null'}の時、正常に変換できるか`, () => {
          let db = msg.toDB();

          assert(db.id === msg.id);
          assert((db.body.receiver === null && msg.receiver === null) ||
            (db.body.receiver !== null && msg.receiver !== null && db.body.receiver === msg.receiver));
          assert(db.body.body === msg.body);
          assert(new Date(db.body.date).valueOf() === msg.date.valueOf());
        });
      });
    });

    describe("#toAPI", () => {
      msgs.forEach(msg => {
        it(`receiverが${msg.receiver ? 'ObjectID' : 'null'}の時、正常に変換できるか`, () => {
          let api = msg.toAPI({
            id: "usid",
            key: "aaa",
            user: msg.receiver || "user",
            type: "master"
          });

          assert(api.id === msg.id.toString());
          assert((api.receiver === null && msg.receiver === null) ||
            (api.receiver !== null && msg.receiver !== null && api.receiver === msg.receiver.toString()));
          assert(api.body === msg.body);
          assert(api.date.valueOf() === msg.date.toISOString());
        });
      });
    });
  }

  describe("fromDB", () => {
    let dbs: IMsgDB[] = [
      {
        id: ObjectIDGenerator.get(),
        body: {
          receiver: ObjectIDGenerator.get(),
          body: "a",
          date: new Date().toISOString()
        }
      },
      {
        id: ObjectIDGenerator.get(),
        body: {
          receiver: null,
          body: "a",
          date: new Date().toISOString()
        }
      }
    ];

    dbs.forEach(db => {
      it(`receiverが${db.body.receiver ? 'ObjectID' : 'null'}の時、正常に作成できるか`, () => {
        let msg = Msg.fromDB(db);

        assert(msg.id === db.id);
        assert((db.body.receiver === null && msg.receiver === null) ||
          (db.body.receiver !== null && msg.receiver !== null && db.body.receiver === msg.receiver));
        assert(msg.body === db.body.body);
        assert(msg.date.valueOf() === new Date(db.body.date).valueOf());
      });
    });
  });

  describe("create", () => {
    it('正常に生成できるか', () => {
      Msg.create(ObjectIDGenerator, null, 'hoge', new Date());
    });
  });
});