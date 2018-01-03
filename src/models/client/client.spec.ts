import { ObjectID } from "mongodb";
import {
  AtError,
  Client,
  IAuthTokenMaster,
  ObjectIDGenerator,
} from "../../";
import { update } from "immutable";

describe("Client", () => {
  describe("create", () => {
    it("http:// から始まるURLで正常に呼び出せるか", () => {
      const now = new Date();
      const client = Client.create(
        () => "client",
        {
          id: "token",
          key: "",
          user: "user",
          type: "master",
        },
        "hoge",
        "http://hoge.com",
        now,
      );

      expect(client.id).toBe("client");
      expect(client.name).toBe("hoge");
      expect(client.url).toBe("http://hoge.com");
      expect(client.user).toBe("user");
      expect(client.date).toEqual(now);
      expect(client.update).toEqual(now);
    });

    it("https:// から始まるURLで正常に呼び出せるか", () => {
      const client = Client.create(
        ObjectIDGenerator,
        {
          id: ObjectIDGenerator(),
          key: "",
          user: ObjectIDGenerator(),
          type: "master",
        },
        "hoge",
        "https://hoge.com",
        new Date(),
      );

      expect(client.url).toBe("https://hoge.com");
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
          new Date(),
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
          new Date(),
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
          new Date(),
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
          new Date(),
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
          new Date(),
        );
      }).toThrow(AtError);
    });
  });

  describe("fromDB", () => {
    it("正常にインスタンス化出来るか", () => {
      const db = {
        _id: new ObjectID(),
        name: "name",
        url: "https://hoge.com",
        user: new ObjectID(),
        date: new Date(),
        update: new Date(),
      };

      const client = Client.fromDB(db);

      expect(client.id).toBe(db._id.toHexString());
      expect(client.name).toBe(db.name);
      expect(client.url).toBe(db.url);
      expect(client.user).toBe(db.user.toHexString());
      expect(client.date).toEqual(db.date);
      expect(client.update).toEqual(db.update);
    });
  });

  describe("#changeData", () => {
    it("正常に変更できるか", () => {
      const auth: IAuthTokenMaster = {
        id: "token",
        key: "",
        user: "user",
        type: "master",
      };

      const date = new Date();
      const update = new Date(date.valueOf() + 1000);

      const client = Client.create(() => "client",
        auth,
        "a",
        "https://a",
        date);

      const newClient = client.changeData(auth, "name", "http://hoge", update);

      expect(newClient.id).toBe("client");
      expect(newClient.name).toBe("name");
      expect(newClient.url).toBe("http://hoge");
      expect(newClient.user).toBe("user");
      expect(newClient.date).toEqual(date);
      expect(newClient.update).toEqual(update);
    });

    it("違うユーザーが変更しようとしたらエラーになるか", () => {
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
          new Date());

        client.changeData({
          id: ObjectIDGenerator(),
          key: "",
          user: ObjectIDGenerator(),
          type: "master",
        }, "foo", "http://foo", new Date());
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
          new Date());

        client.changeData(auth, "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "http://foo", new Date());
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
          new Date());

        client.changeData(auth, "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "http://foo", new Date());
      }).toThrow(AtError);
    });
  });

  {
    const client = Client.fromDB({
      _id: new ObjectID(),
      name: "name",
      url: "https://hoge.com",
      user: new ObjectID(),
      date: new Date(),
      update: new Date(),
    });

    describe("#toAPI", () => {
      it("認証あり(同一ユーザー)", () => {
        const api = client.toAPI({
          id: ObjectIDGenerator(),
          key: "",
          user: client.user,
          type: "master",
        });

        expect(api.id).toBe(client.id);
        expect(api.name).toBe(client.name);
        expect(api.url).toBe(client.url);
        expect(api.user).toBe(client.user);
        expect(api.date).toEqual(client.date.toISOString());
        expect(api.update).toEqual(client.update.toISOString());
      });

      it("認証あり(別ユーザー)", () => {
        const api = client.toAPI({
          id: ObjectIDGenerator(),
          key: "",
          user: ObjectIDGenerator(),
          type: "master",
        });

        expect(api.user).toBeNull();
      });

      it("認証無し", () => {
        const api = client.toAPI(null);

        expect(api.user).toBeNull();
      });
    });

    describe("#toDB", () => {
      it("正常に出力できるか", () => {
        const db = client.toDB();

        expect(db._id).toEqual(new ObjectID(client.id));
        expect(db.name).toBe(client.name);
        expect(db.url).toBe(client.url);
        expect(db.user).toEqual(new ObjectID(client.user));
        expect(db.date).toEqual(client.date);
        expect(db.update).toEqual(client.update);
      });
    });
  }
});
