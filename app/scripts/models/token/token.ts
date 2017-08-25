import { ObjectID } from 'mongodb';
import { Client } from '..//client';
import { IAuthTokenMaster, IAuthTokenGeneral, IAuthUser } from '../../auth';
import { AtTokenAuthError, AtNotFoundError } from '../../at-error'
import { Config } from '../../config';
import { StringUtil } from '../../util';
import { IGenerator } from '../../generator';

export interface ITokenReq {
  key: string,
  expireDate: Date,
  active: boolean
}

export interface ITokenReqAPI {
  token: string,
  key: string
}

export type TokenType = "master" | "general";

export type ITokenDB = ITokenGeneralDB | ITokenMasterDB;

export interface ITokenBaseDB<T extends TokenType> {
  _id: ObjectID,
  key: string,
  type: T,
  user: ObjectID,
  date: Date
}

export interface ITokenMasterDB extends ITokenBaseDB<'master'> {
}

export interface ITokenGeneralDB extends ITokenBaseDB<'general'> {
  client: ObjectID,
  req: ITokenReq[],
}

export type ITokenAPI = ITokenGeneralAPI | ITokenMasterAPI;

export interface ITokenBaseAPI<T extends TokenType> {
  id: string,
  key: string,
  user: string,
  date: string,
  type: T
}

export interface ITokenMasterAPI extends ITokenBaseAPI<'master'> {
}

export interface ITokenGeneralAPI extends ITokenBaseAPI<'general'> {
  client: string,
}

export type Token = TokenMaster | TokenGeneral;

export abstract class TokenBase<T extends TokenType> {
  protected constructor(private _id: ObjectID,
    private _key: string,
    private _user: ObjectID,
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
      _id: this._id,
      key: this._key,
      user: this._user,
      date: this._date,
      type: this._type
    }
  }

  toAPI(): ITokenBaseAPI<T> {
    return {
      id: this._id.toString(),
      key: this._key,
      user: this._user.toString(),
      date: this._date.toISOString(),
      type: this._type
    }
  }

  static createTokenKey(randomGenerator: IGenerator<string>): string {
    return StringUtil.hash(randomGenerator.get() + Config.salt.token);
  }
}

export class TokenMaster extends TokenBase<"master"> {
  private constructor(id: ObjectID,
    key: string,
    user: ObjectID,
    date: Date) {
    super(id, key, user, date, 'master');
  }

  toDB(): ITokenMasterDB {
    return super.toDB();
  }

  toAPI(): ITokenMasterAPI {
    return super.toAPI();
  }

  static fromDB(t: ITokenMasterDB): TokenMaster {
    return new TokenMaster(t._id, t.key, t.user, t.date);
  }

  static create(objidGenerator: IGenerator<ObjectID>, authUser: IAuthUser, now: Date, randomGenerator: IGenerator<string>): TokenMaster {
    return new TokenMaster(objidGenerator.get(),
      TokenBase.createTokenKey(randomGenerator),
      authUser.id,
      now);
  }

  auth(key: string): IAuthTokenMaster {
    if (this.key !== key) {
      throw new AtTokenAuthError();
    }

    return { id: this.id, key: this.key, user: this.user, type: this.type };
  }
}

export class TokenGeneral extends TokenBase<'general'> {
  private constructor(id: ObjectID,
    key: string,
    private _client: ObjectID,
    user: ObjectID,
    private _req: ITokenReq[],
    date: Date) {
    super(id, key, user, date, 'general');
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
      client: this._client,
      req: this._req
    }
  }

  toAPI(): ITokenGeneralAPI {
    return {
      ...super.toAPI(),
      client: this._client.toString(),
    }
  }

  static fromDB(t: ITokenGeneralDB): TokenGeneral {
    return new TokenGeneral(t._id, t.key, t.client, t.user, t.req, t.date);
  }

  static create(objidGenerator: IGenerator<ObjectID>, authToken: IAuthTokenMaster, client: Client, now: Date, randomGenerator: IGenerator<string>): TokenGeneral {
    return new TokenGeneral(objidGenerator.get(),
      TokenBase.createTokenKey(randomGenerator),
      client.id,
      authToken.user,
      [],
      now);
  }

  createReq(now: Date, randomGenerator: IGenerator<string>): ITokenReqAPI {
    let nowNum = now.getTime();

    //ゴミを削除
    this._req = this._req.filter((r) => r.active && nowNum < r.expireDate.getTime());


    //キーの被り防止
    let req: ITokenReq;
    do {
      req = {
        key: TokenBase.createTokenKey(randomGenerator),
        expireDate: new Date(nowNum + 1000 * 60 * Config.user.token.req.expireMinute),
        active: true
      };
    } while (this._req.find(x => x.key === req.key) !== undefined);

    this._req.push(req);

    return {
      token: this.id.toString(),
      key: req.key
    }
  }

  authReq(key: string, now: Date): IAuthTokenGeneral {
    let req = this._req.find(x => x.key === key);
    if (req === undefined || !req.active || req.expireDate.getTime() < now.getTime()) {
      throw new AtNotFoundError("トークンリクエストが見つかりません");
    }

    return { id: this.id, key: this.key, user: this.user, type: 'general', client: this._client };
  }

  auth(key: string): IAuthTokenGeneral {
    if (this.key !== key) {
      throw new AtTokenAuthError();
    }

    return { id: this.id, key: this.key, user: this.user, type: this.type, client: this._client };
  }
}