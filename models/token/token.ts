import { ObjectID } from 'mongodb';
import { Client } from '..//client';
import { IAuthToken, IAuthUser } from '../../auth';
import { AtError, StatusCode } from '../../at-error'
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

export interface ITokenDB {
  _id: ObjectID,
  key: string,
  client: ObjectID,
  user: ObjectID,
  req: ITokenReq[],
  active: boolean,
  date: Date
}

export interface ITokenAPI {
  id: string,
  key: string,
  client: string,
  user: string,
  active: boolean,
  date: string
}

export class Token {
  private constructor(private _id: ObjectID,
    private _key: string,
    private _client: ObjectID,
    private _user: ObjectID,
    private _req: ITokenReq[],
    private _active: boolean,
    private _date: Date) {

  }

  get id() {
    return this._id;
  }

  get key() {
    return this._key;
  }

  get client() {
    return this._client;
  }

  get user() {
    return this._user;
  }

  get req() {
    return this._req;
  }

  get active() {
    return this._active;
  }

  get date() {
    return this._date;
  }

  toDB(): ITokenDB {
    return {
      _id: this._id,
      key: this._key,
      client: this._client,
      user: this._user,
      req: this._req,
      active: this._active,
      date: this._date
    }
  }

  toAPI(): ITokenAPI {
    return {
      id: this._id.toString(),
      key: this._key,
      client: this._client.toString(),
      user: this._user.toString(),
      active: this._active,
      date: this._date.toISOString()
    }
  }

  static fromDB(t: ITokenDB): Token {
    return new Token(t._id, t.key, t.client, t.user, t.req, t.active, t.date);
  }

  static create(objidGenerator: IGenerator<ObjectID>, authUser: IAuthUser, client: Client, now: Date, randomGenerator: IGenerator<string>): Token {
    return new Token(objidGenerator.get(),
      StringUtil.hash(randomGenerator.get() + Config.salt.token),
      client.id,
      authUser.id,
      [],
      true,
      now);
  }

  keyChange(authUser: IAuthUser, randomGenerator: IGenerator<string>) {
    if (!authUser.id.equals(this._user)) {
      throw new AtError(StatusCode.Forbidden, "人のトークンは変えられません");
    }
    this._req = [];
    this._key = StringUtil.hash(randomGenerator.get() + Config.salt.token);
  }

  auth(key: string): IAuthToken {
    if (this._key !== key) {
      throw new AtError(StatusCode.Unauthorized, "認証に失敗しました");
    }

    return { id: this._id, key: this._key, user: this._user };
  }

  createReq(now: Date, randomGenerator: IGenerator<string>): ITokenReqAPI {
    let nowNum = now.getTime();

    //ゴミを削除
    this._req = this._req.filter((r) => r.active && nowNum < r.expireDate.getTime());


    //キーの被り防止
    let req: ITokenReq;
    do {
      req = {
        key: StringUtil.hash(randomGenerator.get() + Config.salt.tokenReq),
        expireDate: new Date(nowNum + 1000 * 60 * Config.user.token.req.expireMinute),
        active: true
      };
    } while (this._req.find(x => x.key === req.key) !== undefined);

    this._req.push(req);

    return {
      token: this._id.toString(),
      key: req.key
    }
  }

  authReq(key: string, now: Date): IAuthToken {
    let req = this._req.find(x => x.key === key);
    if (req === undefined || !req.active || req.expireDate.getTime() < now.getTime()) {
      throw new AtError(StatusCode.NotFound, "トークンリクエストが見つかりません");
    }

    return { id: this._id, key: this._key, user: this._user };
  }

  enable(authUser: IAuthUser) {
    if (!authUser.id.equals(this._user)) {
      throw new AtError(StatusCode.Forbidden, "人のトークンは変えられません");
    }

    this._active = true;
  }

  disable(authUser: IAuthUser) {
    if (!authUser.id.equals(this._user)) {
      throw new AtError(StatusCode.Forbidden, "人のトークンは変えられません");
    }

    this._active = false;
  }
}