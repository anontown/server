import {
  Client,
  ObjectIDGenerator,
  AtError,
  IAuthTokenMaster
} from '../../../scripts';
import * as assert from 'power-assert';
import { ObjectID } from 'mongodb';

describe('Client', () => {
  describe('create', () => {
    it('http:// から始まるURLで正常に呼び出せるか', () => {
      Client.create(
        ObjectIDGenerator,
        {
          id: ObjectIDGenerator.get(),
          key: '',
          user: ObjectIDGenerator.get(),
          type: 'master'
        },
        'hoge',
        'http://hoge.com',
        new Date()
      );
    });

    it('https:// から始まるURLで正常に呼び出せるか', () => {
      Client.create(
        ObjectIDGenerator,
        {
          id: ObjectIDGenerator.get(),
          key: '',
          user: ObjectIDGenerator.get(),
          type: 'master'
        },
        'hoge',
        'https://hoge.com',
        new Date()
      );
    });

    it('長い名前でエラーになるか', () => {
      assert.throws(() => {
        Client.create(
          ObjectIDGenerator,
          {
            id: ObjectIDGenerator.get(),
            key: '',
            user: ObjectIDGenerator.get(),
            type: 'master'
          },
          'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          'http://hoge',
          new Date()
        );
      }, (e: any) => e instanceof AtError);
    });

    it('名前が空文字でエラーになるか', () => {
      assert.throws(() => {
        Client.create(
          ObjectIDGenerator,
          {
            id: ObjectIDGenerator.get(),
            key: '',
            user: ObjectIDGenerator.get(),
            type: 'master'
          },
          '',
          'http://hoge',
          new Date()
        );
      }, (e: any) => e instanceof AtError);
    });

    it('URLスキーマを不正にしたらエラーになるか', () => {
      assert.throws(() => {
        Client.create(
          ObjectIDGenerator,
          {
            id: ObjectIDGenerator.get(),
            key: '',
            user: ObjectIDGenerator.get(),
            type: 'master'
          },
          'hoge',
          'hogehttp://hoge.com',
          new Date()
        );
      }, (e: any) => e instanceof AtError);
    });

    it('URLのホストなしでエラーになるか', () => {
      assert.throws(() => {
        Client.create(
          ObjectIDGenerator,
          {
            id: ObjectIDGenerator.get(),
            key: '',
            user: ObjectIDGenerator.get(),
            type: 'master'
          },
          'http://',
          '',
          new Date()
        );
      }, (e: any) => e instanceof AtError);
    });

    it('URLが空でエラーになるか', () => {
      assert.throws(() => {
        Client.create(
          ObjectIDGenerator,
          {
            id: ObjectIDGenerator.get(),
            key: '',
            user: ObjectIDGenerator.get(),
            type: 'master'
          },
          'hoge',
          '',
          new Date()
        );
      }, (e: any) => e instanceof AtError);
    });
  });

  describe('fromDB', () => {
    it('正常にインスタンス化出来るか', () => {
      let db = {
        _id: new ObjectID(),
        name: 'name',
        url: 'https://hoge.com',
        user: new ObjectID(),
        date: new Date(),
        update: new Date()
      };

      let client = Client.fromDB(db);

      assert(db._id.toHexString() === client.id);
      assert(db.name === client.name);
      assert(db.url === client.url);
      assert(db.user.toHexString() === client.user);
      assert(db.date.getTime() === client.date.getTime());
      assert(db.update.getTime() === client.update.getTime());
    });
  });

  describe("#changeData", () => {
    it("正常に変更できるか", () => {
      let auth: IAuthTokenMaster = {
        id: ObjectIDGenerator.get(),
        key: '',
        user: ObjectIDGenerator.get(),
        type: 'master'
      };

      let client = Client.create(ObjectIDGenerator,
        auth,
        "a",
        "https://a",
        new Date());

      client.changeData(auth, "name", "http://hoge", new Date());
    });

    it("違うユーザーが変更しようとしたらエラーになるか", () => {
      assert.throws(() => {
        let auth: IAuthTokenMaster = {
          id: ObjectIDGenerator.get(),
          key: '',
          user: ObjectIDGenerator.get(),
          type: 'master'
        };

        let client = Client.create(ObjectIDGenerator,
          auth,
          "hoge",
          "http://hoge",
          new Date());

        client.changeData({
          id: ObjectIDGenerator.get(),
          key: '',
          user: ObjectIDGenerator.get(),
          type: 'master'
        }, "foo", "http://foo", new Date());
      }, (e: any) => e instanceof AtError);
    });


    it("長い名前でエラーになるか", () => {
      assert.throws(() => {
        let auth: IAuthTokenMaster = {
          id: ObjectIDGenerator.get(),
          key: '',
          user: ObjectIDGenerator.get(),
          type: 'master'
        };

        let client = Client.create(ObjectIDGenerator,
          auth,
          "hoge",
          "http://hoge",
          new Date());

        client.changeData(auth, "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "http://foo", new Date());
      }, (e: any) => e instanceof AtError);
    });

    it("不正なURLでエラーになるか", () => {
      assert.throws(() => {
        let auth: IAuthTokenMaster = {
          id: ObjectIDGenerator.get(),
          key: '',
          user: ObjectIDGenerator.get(),
          type: 'master'
        };

        let client = Client.create(ObjectIDGenerator,
          auth,
          "hoge",
          "hogehttp://hoge",
          new Date());

        client.changeData(auth, "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "http://foo", new Date());
      }, (e: any) => e instanceof AtError);
    });
  });

  {
    let client = Client.fromDB({
      _id: new ObjectID(),
      name: 'name',
      url: 'https://hoge.com',
      user: new ObjectID(),
      date: new Date(),
      update: new Date()
    });

    describe("#toAPI", () => {
      it("認証あり(同一ユーザー)", () => {
        let api = client.toAPI({
          id: ObjectIDGenerator.get(),
          key: '',
          user: client.user,
          type: 'master'
        });

        assert(client.id === api.id);
        assert(client.name === api.name);
        assert(client.url === api.url);
        assert(client.user === api.user);
        assert(client.date.toISOString() === api.date);
        assert(client.update.toISOString() === api.update);
      });

      it("認証あり(別ユーザー)", () => {
        let api = client.toAPI({
          id: ObjectIDGenerator.get(),
          key: '',
          user: ObjectIDGenerator.get(),
          type: 'master'
        });

        assert(api.user === null);
      });

      it("認証無し", () => {
        let api = client.toAPI(null);

        assert(api.user === null);
      });
    });

    describe("#toDB", () => {
      it("正常に出力できるか", () => {
        let db = client.toDB();

        assert(client.id === db._id.toHexString());
        assert(client.name === db.name);
        assert(client.url === db.url);
        assert(client.user === db.user.toHexString());
        assert(client.date.getTime() === db.date.getTime());
        assert(client.update.getTime() === db.update.getTime())
      });
    });
  }
});