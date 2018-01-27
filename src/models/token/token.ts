import * as Im from "immutable";
import { ObjectID } from "mongodb";
import Copyable, { PartialMap } from "ts-copyable";
import { AtNotFoundError, AtTokenAuthError } from "../../at-error";
import { IAuthTokenGeneral, IAuthTokenMaster, IAuthUser } from "../../auth";
import { Config } from "../../config";
import { IGenerator } from "../../generator";
import { hash } from "../../utils";
import { applyMixins } from "../../utils";
import { Client } from "../client";

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

export abstract class TokenBase<T extends TokenType, C extends TokenBase<T, C>> {
  static createTokenKey(randomGenerator: IGenerator<string>): string {
    return hash(randomGenerator() + Config.salt.token);
  }

  abstract readonly id: string;
  abstract readonly key: string;
  abstract readonly user: string;
  abstract readonly date: Date;
  abstract readonly type: T;

  abstract copy(partial: Partial<TokenBase<T, C>>): C;
  abstract mapCopy(partial: PartialMap<TokenBase<T, C>>): C;

  toBaseDB(): ITokenBaseDB<T> {
    return {
      _id: new ObjectID(this.id),
      key: this.key,
      user: new ObjectID(this.user),
      date: this.date,
      type: this.type,
    };
  }

  toBaseAPI(): ITokenBaseAPI<T> {
    return {
      id: this.id,
      key: this.key,
      user: this.user,
      date: this.date.toISOString(),
      type: this.type,
    };
  }
}

export class TokenMaster extends Copyable<TokenMaster> implements TokenBase<"master", TokenMaster> {
  static fromDB(t: ITokenMasterDB): TokenMaster {
    return new TokenMaster(t._id.toString(), t.key, t.user.toString(), t.date);
  }

  static create(
    objidGenerator: IGenerator<string>,
    authUser: IAuthUser,
    now: Date,
    randomGenerator: IGenerator<string>): TokenMaster {
    return new TokenMaster(objidGenerator(),
      TokenBase.createTokenKey(randomGenerator),
      authUser.id,
      now);
  }

  readonly type: "master" = "master";

  toBaseAPI: () => ITokenBaseAPI<"master">;
  toBaseDB: () => ITokenBaseDB<"master">;

  constructor(
    readonly id: string,
    readonly key: string,
    readonly user: string,
    readonly date: Date) {
    super(TokenMaster);
  }

  toDB(): ITokenMasterDB {
    return this.toBaseDB();
  }

  toAPI(): ITokenMasterAPI {
    return this.toBaseAPI();
  }

  auth(key: string): IAuthTokenMaster {
    if (this.key !== key) {
      throw new AtTokenAuthError();
    }

    return { id: this.id, key: this.key, user: this.user, type: this.type };
  }
}
applyMixins(TokenMaster, [TokenBase]);

export class TokenGeneral extends Copyable<TokenGeneral> implements TokenBase<"general", TokenGeneral> {
  static fromDB(t: ITokenGeneralDB): TokenGeneral {
    return new TokenGeneral(t._id.toString(), t.key, t.client.toString(), t.user.toString(), Im.List(t.req), t.date);
  }

  static create(
    objidGenerator: IGenerator<string>,
    authToken: IAuthTokenMaster,
    client: Client,
    now: Date,
    randomGenerator: IGenerator<string>): TokenGeneral {
    return new TokenGeneral(objidGenerator(),
      TokenBase.createTokenKey(randomGenerator),
      client.id,
      authToken.user,
      Im.List(),
      now);
  }

  readonly type: "general" = "general";

  toBaseAPI: () => ITokenBaseAPI<"general">;
  toBaseDB: () => ITokenBaseDB<"general">;

  constructor(
    readonly id: string,
    readonly key: string,
    readonly client: string,
    readonly user: string,
    readonly req: Im.List<ITokenReq>,
    readonly date: Date) {
    super(TokenGeneral);
  }

  toDB(): ITokenGeneralDB {
    return {
      ...this.toBaseDB(),
      client: new ObjectID(this.client),
      req: this.req.toArray(),
    };
  }

  toAPI(): ITokenGeneralAPI {
    return {
      ...this.toBaseAPI(),
      client: this.client,
    };
  }

  createReq(now: Date, randomGenerator: IGenerator<string>): { token: TokenGeneral, req: ITokenReqAPI } {
    const nowNum = now.getTime();

    // ゴミを削除
    const reqFilter = this.req.filter(r => r.active && nowNum < r.expireDate.getTime());

    // キーの被り防止
    let req: ITokenReq;
    do {
      req = {
        key: TokenBase.createTokenKey(randomGenerator),
        expireDate: new Date(nowNum + 1000 * 60 * Config.user.token.req.expireMinute),
        active: true,
      };
    } while (reqFilter.find(x => x.key === req.key) !== undefined);

    return {
      token: this.copy({
        req: reqFilter.push(req),
      }),
      req: {
        token: this.id,
        key: req.key,
      },
    };
  }

  authReq(key: string, now: Date): IAuthTokenGeneral {
    const req = this.req.find(x => x.key === key);
    if (req === undefined || !req.active || req.expireDate.getTime() < now.getTime()) {
      throw new AtNotFoundError("トークンリクエストが見つかりません");
    }

    return { id: this.id, key: this.key, user: this.user, type: "general", client: this.client };
  }

  auth(key: string): IAuthTokenGeneral {
    if (this.key !== key) {
      throw new AtTokenAuthError();
    }

    return { id: this.id, key: this.key, user: this.user, type: this.type, client: this.client };
  }
}
applyMixins(TokenGeneral, [TokenBase]);
