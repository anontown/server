import * as Im from "immutable";
import { ObjectID } from "mongodb";
import {
  AtError,
  Client,
  IAuthTokenMaster,
  ObjectIDGenerator,
  TokenBase,
  TokenGeneral,
} from "../../";

describe("TokenMaster", () => {
  const clientID = ObjectIDGenerator();
  const userID = ObjectIDGenerator();
  const client = new Client(clientID,
    "name",
    "https://hoge.com",
    userID,
    new Date(100),
    new Date(200));

  const auth: IAuthTokenMaster = {
    id: ObjectIDGenerator(),
    key: "key",
    user: userID,
    type: "master",
  };

  const tokenID = ObjectIDGenerator();
  const token = new TokenGeneral(tokenID,
    "key",
    clientID,
    userID,
    Im.List(),
    new Date(300));

  describe("fromDB", () => {
    it("正常に変換出来るか", () => {
      expect(TokenGeneral.fromDB({
        _id: new ObjectID(tokenID),
        key: "key",
        type: "general",
        client: new ObjectID(clientID),
        user: new ObjectID(userID),
        date: new Date(300),
        req: [],
      })).toEqual(token);
    });
  });

  describe("create", () => {
    it("正常に作成出来るか", () => {
      expect(TokenGeneral.create(() => tokenID,
        auth,
        client,
        new Date(300),
        () => "random")).toEqual(token.copy({ key: TokenBase.createTokenKey(() => "random") }));
    });
  });

  describe("toDB", () => {
    it("正常に変換出来るか", () => {
      expect(token.toDB()).toEqual({
        ...token.toBaseDB(),
        client: new ObjectID(clientID),
        req: [],
      });
    });
  });

  describe("toAPI", () => {
    it("正常に変換出来るか", () => {
      expect(token.toAPI()).toEqual({
        ...token.toBaseAPI(),
        clientID,
      });
    });
  });

  describe("createReq", () => {
    it("正常に追加出来るか", () => {
      const date = new Date(0);
      const { token: newToken, req } = token.createReq(date, () => "random");
      const r = {
        key: TokenBase.createTokenKey(() => "random"),
        expireDate: new Date(300000),
        active: true,
      };
      expect(req).toEqual({ token: token.id, key: r.key });
      expect(newToken).toEqual(token.copy({ req: Im.List([r]) }));
    });

    it("期限切れのトークンと死んでいるトークンが削除されてるか", () => {
      const date = new Date(100);
      const { token: newToken, req } = token.copy({
        req: Im.List([
          {
            key: "a",
            expireDate: new Date(50),
            active: true,
          },
          {
            key: "b",
            expireDate: new Date(150),
            active: false,
          },
          {
            key: "c",
            expireDate: new Date(150),
            active: true,
          },
        ]),
      }).createReq(date, () => "random");
      const r = {
        key: TokenBase.createTokenKey(() => "random"),
        expireDate: new Date(300100),
        active: true,
      };
      expect(req).toEqual({ token: token.id, key: r.key });
      expect(newToken).toEqual(token.copy({
        req: Im.List([
          {
            key: "c",
            expireDate: new Date(150),
            active: true,
          },
          { ...r, active: true },
        ]),
      }));
    });
  });

  describe("authReq", () => {
    it("正常に認証出来るか", () => {
      const date = new Date(0);
      const authToken = token.copy({
        req: Im.List([
          {
            key: "a",
            expireDate: new Date(50),
            active: true,
          },
        ]),
      }).authReq("a", date);

      expect(authToken).toEqual({
        id: token.id,
        key: token.key,
        user: token.user,
        type: "general",
        client: token.client,
      });
    });

    it("有効期限切れでエラーになるか", () => {
      expect(() => {
        token.copy({
          req: Im.List([
            {
              key: "a",
              expireDate: new Date(50),
              active: true,
            },
          ]),
        }).authReq("a", new Date(100));
      }).toThrow(AtError);
    });

    it("死んでいるとエラーになるか", () => {
      expect(() => {
        token.copy({
          req: Im.List([
            {
              key: "a",
              expireDate: new Date(50),
              active: false,
            },
          ]),
        }).authReq("a", new Date(0));
      }).toThrow(AtError);
    });

    it("トークンが存在しないとエラーに鳴るか", () => {
      expect(() => {
        token.copy({
          req: Im.List([
            {
              key: "a",
              expireDate: new Date(50),
              active: true,
            },
          ]),
        }).authReq("b", new Date(0));
      }).toThrow(AtError);
    });
  });

  describe("auth", () => {
    it("正常に認証出来るか", () => {
      const auth = token.auth("key");
      expect(auth).toEqual({
        id: token.id,
        key: token.key,
        user: token.user,
        type: "general",
        client: token.client,
      });
    });

    it("キーが違う時、認証に失敗するか", () => {
      expect(() => {
        token.auth("key2");
      }).toThrow(AtError);
    });
  });
});
