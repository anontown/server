import {
  ObjectIDGenerator,
  Msg,
  IMsgDB
} from '../../../scripts';
import * as assert from 'power-assert';
import { ObjectID } from 'mongodb';

describe("Msg", () => {
  {
    let msgs = [
      Msg.fromDB({
        _id: new ObjectID(),
        receiver: new ObjectID(),
        body: "あいうえお",
        date: new Date()
      }),
      Msg.fromDB({
        _id: new ObjectID(),
        receiver: null,
        body: "あいうえお",
        date: new Date()
      })
    ];

    describe("#toDB", () => {
      msgs.forEach(msg => {
        it(`receiverが${msg.receiver ? 'ObjectID' : 'null'}の時、正常に変換できるか`, () => {
          let db = msg.toDB();

          assert(db._id.equals(msg.id));
          assert((db.receiver === null && msg.receiver === null) ||
            (db.receiver !== null && msg.receiver !== null && db.receiver.equals(msg.receiver)));
          assert(db.body === msg.body);
          assert(db.date.valueOf() === msg.date.valueOf());
        });
      });
    });

    describe("#toAPI", () => {
      msgs.forEach(msg => {
        it(`receiverが${msg.receiver ? 'ObjectID' : 'null'}の時、正常に変換できるか`, () => {
          let api = msg.toAPI();

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
        _id: new ObjectID(),
        receiver: new ObjectID(),
        body: "a",
        date: new Date()
      },
      {
        _id: new ObjectID(),
        receiver: null,
        body: "a",
        date: new Date()
      }
    ];

    dbs.forEach(db => {
      it(`receiverが${db.receiver ? 'ObjectID' : 'null'}の時、正常に作成できるか`, () => {
        let msg = Msg.fromDB(db);

        assert(msg.id.equals(db._id));
        assert((db.receiver === null && msg.receiver === null) ||
          (db.receiver !== null && msg.receiver !== null && db.receiver.equals(msg.receiver)));
        assert(msg.body === db.body);
        assert(msg.date.valueOf() === db.date.valueOf());
      });
    });
  });

  describe("create", () => {
    it('正常に生成できるか', () => {
      Msg.create(ObjectIDGenerator, null, 'hoge', new Date());
    });
  });
});