import { ObjectID, WriteError } from 'mongodb';
import { Client } from './client';
import { DB } from '../db';
import { IAuthToken, IAuthUser } from '../auth';
import { AtError, StatusCode } from '../at-error'
import { Config } from '../config';
import { StringUtil } from '../util';
import * as fs from 'fs-promise';

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

  get id():ObjectID{
    return this._id;
  }

  private getStorageFilePath(name: string) {
    return "./storage/" + this._id.toString() + "/st-" + name;
  }

  async getStorage(name: string): Promise<string> {
    if (!name.match(Config.user.token.storage.regex)) {
      throw new AtError(StatusCode.MisdirectedRequest, Config.user.token.storage.msg);
    }
    try {
      return await fs.readFile(this.getStorageFilePath(name), { encoding: "utf-8" });
    } catch (_e) {
      throw new AtError(StatusCode.NotFound, "ストレージが見つかりません");
    }
  }

  async setStorage(name: string, value: string): Promise<void> {
    if (!name.match(Config.user.token.storage.regex)) {
      throw new AtError(StatusCode.MisdirectedRequest, Config.user.token.storage.msg);
    }

    try {
      await fs.writeFile(this.getStorageFilePath(name), value, { encoding: "utf-8" });
    } catch (_e) {
      throw new Error();
    }
  }

  async deleteStorage(name: string): Promise<void> {
    if (!name.match(Config.user.token.storage.regex)) {
      throw new AtError(StatusCode.MisdirectedRequest, Config.user.token.storage.msg);
    }

    try{
      await fs.unlink(this.getStorageFilePath(name))
    }catch(_e){
      throw new AtError(StatusCode.NotFound, "ストレージが見つかりません");
    }
  }

  async listStorage(): Promise<string[]> {
    try{
      let ls=await fs.readdir("./storage/" + this._id.toString() + "/");
      return ls.map(s => s.substring(4));
    }catch(_e){
      throw new Error();
    }
  }

  static async findOne(id: ObjectID): Promise<Token> {
    let db = await DB;
    let token: ITokenDB | null = await db.collection("tokens").findOne({ _id: id });
    if (token === null) {
      throw new AtError(StatusCode.NotFound, "トークンが存在しません");
    }

    return this.fromDB(token);
  }

  static async findAll(authUser: IAuthUser): Promise<Token[]> {
    let db = await DB;
    let tokens: ITokenDB[] = await db.collection("tokens")
      .find({ user: authUser.id })
      .sort({ date: -1 })
      .toArray();

    return tokens.map(t => this.fromDB(t));
  }

  static async insert(token: Token): Promise<null> {
    let db = await DB;
    await db.collection("tokens").insert(token.toDB()).catch((e: WriteError) => {
      if (e.code === 11000) {
        throw new AtError(StatusCode.Conflict, "トークンが存在しません");
      } else {
        throw e;
      }
    });

    await fs.mkdir("./storage/" + token.id.toString());

    return null;
  }

  static async update(token: Token): Promise<null> {
    let db = await DB;
    await db.collection("tokens").update({ _id: token._id }, token.toDB());
    return null;
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

  static create(authUser: IAuthUser, client: Client): Token {
    return new Token(new ObjectID(),
      StringUtil.hash(String(Math.random()) + Config.salt.token),
      client.id,
      authUser.id,
      [],
      true,
      new Date());
  }

  keyChange(authUser: IAuthUser) {
    if (!authUser.id.equals(this._user)) {
      throw new AtError(StatusCode.Forbidden, "人のトークンは変えられません");
    }
    this._req = [];
    this._key = StringUtil.hash(String(Math.random()) + Config.salt.token);
  }

  auth(key: string): IAuthToken {
    if (this._key !== key) {
      throw new AtError(StatusCode.Unauthorized, "認証に失敗しました");
    }

    return { id: this._id, key: this._key, user: this._user };
  }

  createReq(): ITokenReqAPI {
    let now = Date.now();

    //ゴミを削除
    this._req = this._req.filter((r) => r.active && now < r.expireDate.getTime());


    //キーの被り防止
    let req: ITokenReq;
    do {
      req = {
        key: StringUtil.hash(String(Math.random()) + Config.salt.tokenReq),
        expireDate: new Date(now + 1000 * 60 * Config.user.token.req.expireMinute),
        active: true
      };
    } while (this._req.find(x => x.key === req.key) !== undefined);

    this._req.push(req);

    return {
      token: this._id.toString(),
      key: req.key
    }
  }

  authReq(key: string): IAuthToken {
    let req = this._req.find(x => x.key === key);
    if (req === undefined || !req.active || req.expireDate.getTime() < Date.now()) {
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