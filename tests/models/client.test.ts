import {
  Client,
  ObjectIDGenerator,
  AtError,
  IAuthUser
} from '../../scripts';
import * as assert from 'power-assert';
import { ObjectID } from 'mongodb';

describe('Client', () => {
  describe('create', () => {
    it('http:// から始まるURLで正常に呼び出せるか', () => {
      Client.create(
        ObjectIDGenerator,
        {
          id: new ObjectID(),
          pass: ''
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
          id: new ObjectID(),
          pass: ''
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
            id: new ObjectID(),
            pass: ''
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
            id: new ObjectID(),
            pass: ''
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
            id: new ObjectID(),
            pass: ''
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
            id: new ObjectID(),
            pass: ''
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
            id: new ObjectID(),
            pass: ''
          },
          'hoge',
          '',
          new Date()
        );
      }, (e: any) => e instanceof AtError);
    });
  });

  describe("#changeData", () => {
    it("正常に変更できるか", () => {
      let auth: IAuthUser = {
        id: new ObjectID(),
        pass: ""
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
        let auth: IAuthUser = {
          id: new ObjectID(),
          pass: ""
        };

        let client = Client.create(ObjectIDGenerator,
          auth,
          "hoge",
          "http://hoge",
          new Date());

        client.changeData({
          id: new ObjectID(),
          pass: ""
        }, "foo", "http://foo", new Date());
      }, (e: any) => e instanceof AtError);
    });


    it("長い名前でエラーになるか", () => {
      assert.throws(() => {
        let auth: IAuthUser = {
          id: new ObjectID(),
          pass: ""
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
        let auth: IAuthUser = {
          id: new ObjectID(),
          pass: ""
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


});