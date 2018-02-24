import { ObjectID } from "mongodb";
import {
  AtError,
  Client,
  IAuthTokenMaster,
  ObjectIDGenerator,
} from "../../";

describe("Client", () => {
  describe("create", () => {
    it("http:// から始まるURLで正常に呼び出せるか", () => {
      expect(Client.create(
        () => "client",
        {
          id: "token",
          key: "",
          user: "user",
          type: "master",
        },
        "hoge",
        "http://hoge.com",
        new Date(0),
      )).toEqual(new Client("client",
        "hoge",
        "http://hoge.com",
        "user",
        new Date(0),
        new Date(0)));
    });

    it("https:// から始まるURLで正常に呼び出せるか", () => {
      expect(Client.create(
        () => "client",
        {
          id: "token",
          key: "",
          user: "user",
          type: "master",
        },
        "hoge",
        "https://hoge.com",
        new Date(0),
      )).toEqual(new Client("client",
        "hoge",
        "https://hoge.com",
        "user",
        new Date(0),
        new Date(0)));
    });

    it("長い名前でエラーになるか", () => {
      expect(() => {
        Client.create(
          ObjectIDGenerator,
          {
            id: ObjectIDGenerator(),
            key: "",
            user: ObjectIDGenerator(),
            type: "master",
          },
          "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          "http://hoge",
          new Date(0),
        );
      }).toThrow(AtError);
    });

    it("名前が空文字でエラーになるか", () => {
      expect(() => {
        Client.create(
          ObjectIDGenerator,
          {
            id: ObjectIDGenerator(),
            key: "",
            user: ObjectIDGenerator(),
            type: "master",
          },
          "",
          "http://hoge",
          new Date(0),
        );
      }).toThrow(AtError);
    });

    it("URLスキーマを不正にしたらエラーになるか", () => {
      expect(() => {
        Client.create(
          ObjectIDGenerator,
          {
            id: ObjectIDGenerator(),
            key: "",
            user: ObjectIDGenerator(),
            type: "master",
          },
          "hoge",
          "hogehttp://hoge.com",
          new Date(0),
        );
      }).toThrow(AtError);
    });

    it("URLのホストなしでエラーになるか", () => {
      expect(() => {
        Client.create(
          ObjectIDGenerator,
          {
            id: ObjectIDGenerator(),
            key: "",
            user: ObjectIDGenerator(),
            type: "master",
          },
          "http://",
          "",
          new Date(0),
        );
      }).toThrow(AtError);
    });

    it("URLが空でエラーになるか", () => {
      expect(() => {
        Client.create(
          ObjectIDGenerator,
          {
            id: ObjectIDGenerator(),
            key: "",
            user: ObjectIDGenerator(),
            type: "master",
          },
          "hoge",
          "",
          new Date(0),
        );
      }).toThrow(AtError);
    });
  });

  describe("fromDB", () => {
    it("正常にインスタンス化出来るか", () => {
      const clientID = ObjectIDGenerator();
      const userID = ObjectIDGenerator();
      expect(Client.fromDB({
        _id: new ObjectID(clientID),
        name: "name",
        url: "https://hoge.com",
        user: new ObjectID(userID),
        date: new Date(0),
        update: new Date(100),
      })).toEqual(new Client(clientID,
        "name",
        "https://hoge.com",
        userID,
        new Date(0),
        new Date(100)));
    });
  });

  const clientID = ObjectIDGenerator();
  const userID = ObjectIDGenerator();
  const client = new Client(clientID,
    "name",
    "http://hoge.com",
    userID,
    new Date(0),
    new Date(100));

  const auth: IAuthTokenMaster = {
    id: "token",
    key: "key",
    user: userID,
    type: "master",
  };

  describe("#changeData", () => {
    it("正常に変更できるか", () => {
      expect(client.changeData(auth,
        "name2",
        "http://hoge2.com",
        new Date(200))).toEqual(new Client(clientID,
          "name2",
          "http://hoge2.com",
          userID,
          new Date(0),
          new Date(200)));
    });

    it("違うユーザーが変更しようとしたらエラーになるか", () => {
      expect(() => {
        const auth: IAuthTokenMaster = {
          id: "token",
          key: "key",
          user: ObjectIDGenerator(),
          type: "master",
        };

        const client = Client.create(ObjectIDGenerator,
          auth,
          "hoge",
          "http://hoge",
          new Date(0));

        client.changeData({
          id: ObjectIDGenerator(),
          key: "",
          user: ObjectIDGenerator(),
          type: "master",
        }, "foo", "http://foo", new Date(100));
      }).toThrow(AtError);
    });

    it("長い名前でエラーになるか", () => {
      expect(() => {
        const auth: IAuthTokenMaster = {
          id: ObjectIDGenerator(),
          key: "",
          user: ObjectIDGenerator(),
          type: "master",
        };

        const client = Client.create(ObjectIDGenerator,
          auth,
          "hoge",
          "http://hoge",
          new Date(0));

        client.changeData(auth, "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "http://foo", new Date(100));
      }).toThrow(AtError);
    });

    it("不正なURLでエラーになるか", () => {
      expect(() => {
        const auth: IAuthTokenMaster = {
          id: ObjectIDGenerator(),
          key: "",
          user: ObjectIDGenerator(),
          type: "master",
        };

        const client = Client.create(ObjectIDGenerator,
          auth,
          "hoge",
          "hogehttp://hoge",
          new Date(0));

        client.changeData(auth, "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "http://foo", new Date(100));
      }).toThrow(AtError);
    });
  });

  describe("#toAPI", () => {
    it("認証あり(同一ユーザー)", () => {
      expect(client.toAPI(auth)).toEqual({
        id: clientID,
        name: "name",
        url: "http://hoge.com",
        user: userID,
        date: new Date(0).toISOString(),
        update: new Date(100).toISOString(),
      });
    });

    it("認証あり(別ユーザー)", () => {
      expect(client.toAPI({
        ...auth,
        user: ObjectIDGenerator(),
      })).toEqual({
        id: clientID,
        name: "name",
        url: "http://hoge.com",
        user: null,
        date: new Date(0).toISOString(),
        update: new Date(100).toISOString(),
      });
    });

    it("認証無し", () => {
      expect(client.toAPI(null)).toEqual({
        id: clientID,
        name: "name",
        url: "http://hoge.com",
        user: null,
        date: new Date(0).toISOString(),
        update: new Date(100).toISOString(),
      });
    });
  });

  describe("#toDB", () => {
    it("正常に出力できるか", () => {
      expect(client.toDB()).toEqual({
        _id: new ObjectID(clientID),
        name: "name",
        url: "http://hoge.com",
        user: new ObjectID(userID),
        date: new Date(0),
        update: new Date(100),
      });
    });
  });
});
