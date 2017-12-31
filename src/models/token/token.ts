import { ObjectID } from "mongodb";
import { AtNotFoundError, AtTokenAuthError } from "../../at-error";
import { IAuthTokenGeneral, IAuthTokenMaster, IAuthUser } from "../../auth";
import { Config } from "../../config";
import { IGenerator } from "../../generator";
import { StringUtil } from "../../utils";
import { Client } from "..//client";

export interface ITokenReq {
  readonly key: string;
  readonly expireDate: Date;
  readonly active: boolean;
}

export interface ITokenReqAPI {
  readonly token: string;
  readonly key: string;
}

export type TokenType = "master" | "general";

export type ITokenDB = ITokenGeneralDB | ITokenMasterDB;

export interface ITokenBaseDB<T extends TokenType> {
  readonly _id: ObjectID;
  readonly key: string;
  readonly type: T;
  readonly user: ObjectID;
  readonly date: Date;
}

export interface ITokenMasterDB extends ITokenBaseDB<"master"> {
}

export interface ITokenGeneralDB extends ITokenBaseDB<"general"> {
  readonly client: ObjectID;
  readonly req: ITokenReq[];
}

export type ITokenAPI = ITokenGeneralAPI | ITokenMasterAPI;

export interface ITokenBaseAPI<T extends TokenType> {
  readonly id: string;
  readonly key: string;
  readonly user: string;
  readonly date: string;
  readonly type: T;
}

export interface ITokenMasterAPI extends ITokenBaseAPI<"master"> {
}

export interface ITokenGeneralAPI extends ITokenBaseAPI<"general"> {
  readonly client: string;
}

export type Token = TokenMaster | TokenGeneral;

export abstract class TokenBase<T extends TokenType> {
  static createTokenKey(randomGenerator: IGenerator<string>): string {
    return StringUtil.hash(randomGenerator.get() + Config.salt.token);
  }

  protected constructor(
    private _id: string,
    private _key: string,
    private _user: string,
    private _date: Date,
    private _type: T) {

  }

  get id() {
    return this._id;
  }

  get key() {
    return this._key;
  }

  get user() {
    return this._user;
  }

  get type() {
    return this._type;
  }

  get date() {
    return this._date;
  }

  toDB(): ITokenBaseDB<T> {
    return {
      _id: new ObjectID(this._id),
      key: this._key,
      user: new ObjectID(this._user),
      date: this._date,
      type: this._type,
    };
  }

  toAPI(): ITokenBaseAPI<T> {
    return {
      id: this._id,
      key: this._key,
      user: this._user,
      date: this._date.toISOString(),
      type: this._type,
    };
  }
}

export class TokenMaster extends TokenBase<"master"> {
  static fromDB(t: ITokenMasterDB): TokenMaster {
    return new TokenMaster(t._id.toString(), t.key, t.user.toString(), t.date);
  }

  static create(
    objidGenerator: IGenerator<string>,
    authUser: IAuthUser,
    now: Date,
    randomGenerator: IGenerator<string>): TokenMaster {
    return new TokenMaster(objidGenerator.get(),
      TokenBase.createTokenKey(randomGenerator),
      authUser.id,
      now);
  }

  private constructor(
    id: string,
    key: string,
    user: string,
    date: Date) {
    super(id, key, user, date, "master");
  }

  toDB(): ITokenMasterDB {
    return super.toDB();
  }

  toAPI(): ITokenMasterAPI {
    return super.toAPI();
  }

  auth(key: string): IAuthTokenMaster {
    if (this.key !== key) {
      throw new AtTokenAuthError();
    }

    return { id: this.id, key: this.key, user: this.user, type: this.type };
  }
}

export class TokenGeneral extends TokenBase<"general"> {
  static fromDB(t: ITokenGeneralDB): TokenGeneral {
    return new TokenGeneral(t._id.toString(), t.key, t.client.toString(), t.user.toString(), t.req, t.date);
  }

  static create(
    objidGenerator: IGenerator<string>,
    authToken: IAuthTokenMaster,
    client: Client,
    now: Date,
    randomGenerator: IGenerator<string>): TokenGeneral {
    return new TokenGeneral(objidGenerator.get(),
      TokenBase.createTokenKey(randomGenerator),
      client.id,
      authToken.user,
      [],
      now);
  }

  private constructor(
    id: string,
    key: string,
    private _client: string,
    user: string,
    private _req: ITokenReq[],
    date: Date) {
    super(id, key, user, date, "general");
  }

  get client() {
    return this._client;
  }

  get req() {
    return this._req;
  }

  toDB(): ITokenGeneralDB {
    return {
      ...super.toDB(),
      client: new ObjectID(this._client),
      req: this._req,
    };
  }

  toAPI(): ITokenGeneralAPI {
    return {
      ...super.toAPI(),
      client: this._client,
    };
  }

  createReq(now: Date, randomGenerator: IGenerator<string>): ITokenReqAPI {
    const nowNum = now.getTime();

    // ゴミを削除
    this._req = this._req.filter(r => r.active && nowNum < r.expireDate.getTime());

    // キーの被り防止
    let req: ITokenReq;
    do {
      req = {
        key: TokenBase.createTokenKey(randomGenerator),
        expireDate: new Date(nowNum + 1000 * 60 * Config.user.token.req.expireMinute),
        active: true,
      };
    } while (this._req.find(x => x.key === req.key) !== undefined);

    this._req.push(req);

    return {
      token: this.id,
      key: req.key,
    };
  }

  authReq(key: string, now: Date): IAuthTokenGeneral {
    const req = this._req.find(x => x.key === key);
    if (req === undefined || !req.active || req.expireDate.getTime() < now.getTime()) {
      throw new AtNotFoundError("トークンリクエストが見つかりません");
    }

    return { id: this.id, key: this.key, user: this.user, type: "general", client: this._client };
  }

  auth(key: string): IAuthTokenGeneral {
    if (this.key !== key) {
      throw new AtTokenAuthError();
    }

    return { id: this.id, key: this.key, user: this.user, type: this.type, client: this._client };
  }
}
