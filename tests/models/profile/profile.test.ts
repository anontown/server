import {
  Profile
} from '../../../scripts';
import * as assert from 'power-assert';
import { ObjectID } from 'mongodb';

describe("Profile", () => {
  {
    let profile = Profile.fromDB({
      _id: new ObjectID(),
      user: new ObjectID(),
      name: '名前',
      text: '本文',
      mdtext: '<p>本文</p>',
      date: new Date(),
      update: new Date(),
      sn: 'sn'
    });
    describe('#toDB', () => {
      it('正常に変換できるか', () => {
        let db = profile.toDB();

        assert(db._id.equals(profile.id));
        assert(db.user.equals(profile.user));
        assert(db.name === profile.name);
        assert(db.text === profile.text);
        assert(db.mdtext === profile.mdtext);
        assert(db.date.valueOf() === profile.date.valueOf());
        assert(db.update.valueOf() === profile.update.valueOf());
        assert(db.sn === profile.sn);
      });
    });

    describe('#toAPI', () => {
      for (let data of [
        {
          msg: '認証あり(同一ユーザー)',
          user: new ObjectID(profile.user.toString()),
          apiUser: profile.user.toString()
        },
        {
          msg: '認証あり(別ユーザー)',
          user: new ObjectID(),
          apiUser: null
        },
        {
          msg: '認証なし',
          user: null,
          apiUser: null
        },
      ]) {
        it(data.msg, () => {
          let api = profile.toAPI(data.user !== null ? {
            type: 'master',
            user: data.user,
            key: '',
            id: new ObjectID()
          } : null);

          assert(api.id === profile.id.toString());
          assert(api.user === data.apiUser);
          assert(api.name === profile.name);
          assert(api.text === profile.text);
          assert(api.mdtext === profile.mdtext);
          assert(api.date === profile.date.toISOString());
          assert(api.update === profile.update.toISOString());
          assert(api.sn === profile.sn);
        });
      }
    });
  }

  describe('create', () => {
    it('正常に作れるか', () => {
      let user = new ObjectID().toString();
      let id = new ObjectID().toString();
      let date = Date.now();
      let profile = Profile.create({ get: () => new ObjectID(id) }, {
        type: 'master',
        user: new ObjectID(user),
        key: '',
        id: new ObjectID()
      }, '名前', '本文', 'test', new Date(date));
      assert(profile.id.toString() === id);
      assert(profile.user.toString() === user);
      assert(profile.name === '名前');
      assert(profile.text === '本文');
      assert(profile.date.valueOf() === date);
      assert(profile.update.valueOf() === date);
      assert(profile.sn === 'sn');
    });
  });
});