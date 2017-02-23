import {
  Client,
  ObjectIDGenerator,
  AtError,
  IAuthUser
} from '../../scripts';
import * as assert from 'assert';
import { ObjectID } from 'mongodb';

describe('Client', () => {
  describe('create', () => {
    it('正常にnew出来るか', () => {
      [
        { name: 'name', url: 'http://localhost' },
        { name: 'name', url: 'https://localhost' },
        { name: 'name', url: 'http://localhost.com' },
        { name: 'name', url: 'https://hoge.hoge.localhost.com' },
      ].forEach(val => {
        assert.throws(() => {
          Client.create(
            ObjectIDGenerator,
            {
              id: new ObjectID(),
              pass: ''
            },
            val.name,
            val.name,
            new Date()
          );
        }, (e: any) => e instanceof AtError, '名前を長くしてもエラーにならない');
      });
    });

    it('名前を不正にしたらエラーになるか', () => {
      ['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', ''].forEach(name => {
        assert.throws(() => {
          Client.create(
            ObjectIDGenerator,
            {
              id: new ObjectID(),
              pass: ''
            },
            name,
            'http://hoge',
            new Date()
          );
        }, (e: any) => e instanceof AtError, '名前を不正にしてもエラーにならない');
      });
    });

    it('URLを不正にしたらエラーになるか', () => {
      ['hogehttp://', 'hoge', 'hogehttps://', 'http://', 'https://', ''].forEach(url => {
        assert.throws(() => {
          Client.create(
            ObjectIDGenerator,
            {
              id: new ObjectID(),
              pass: ''
            },
            'a',
            url,
            new Date()
          );
        }, (e: any) => e instanceof AtError, 'URLが不正なのにエラーにならない');
      })
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

      client.changeData(auth,"name","http://hoge",new Date());
    });
  });

});