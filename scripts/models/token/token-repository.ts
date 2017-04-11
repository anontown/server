import { ObjectID, WriteError } from 'mongodb';
import { DB } from '../../db';
import { AtNotFoundError, AtConflictError, paramsErrorMaker } from '../../at-error'
import { Token, ITokenDB, TokenGeneral, TokenMaster } from './token';
import { IAuthTokenMaster, IAuthToken } from '../../auth';
import { Config } from '../../config';

export interface IStorageDB {
  client: ObjectID | null,
  user: ObjectID,
  key: string,
  value: string
}

export class TokenRepository {
  static async findOne(id: ObjectID): Promise<Token> {
    let db = await DB;
    let token: ITokenDB | null = await db.collection("tokens").findOne({ _id: id });
    if (token === null) {
      throw new AtNotFoundError("トークンが存在しません");
    }

    switch (token.type) {
      case 'general':
        return TokenGeneral.fromDB(token);
      case 'master':
        return TokenMaster.fromDB(token);
    }
  }

  static async findAll(authToken: IAuthTokenMaster): Promise<Token[]> {
    let db = await DB;
    let tokens: ITokenDB[] = await db.collection("tokens")
      .find({ user: authToken.user })
      .sort({ date: -1 })
      .toArray();

    return tokens.map(t => {
      switch (t.type) {
        case 'general':
          return TokenGeneral.fromDB(t);
        case 'master':
          return TokenMaster.fromDB(t);
      }
    });
  }

  static async insert(token: Token): Promise<null> {
    let db = await DB;
    await db.collection("tokens").insert(token.toDB()).catch((e: WriteError) => {
      if (e.code === 11000) {
        throw new AtConflictError("トークンが既にあります");
      } else {
        throw e;
      }
    });

    return null;
  }

  static async update(token: Token): Promise<null> {
    let db = await DB;
    await db.collection("tokens").update({ _id: token.id }, token.toDB());
    return null;
  }

  private static createStorageFindQuery(token: IAuthToken, name: string | null) {
    let q = {
      user: token.user,
      client: token.type === 'general' ? token.client : null
    };
    if (name !== null) {
      return { ...q, key: name };
    } else {
      return q;
    }
  }

  static async getStorage(token: IAuthToken, name: string): Promise<string> {
    paramsErrorMaker([
      {
        field: "name",
        val: name,
        regex: Config.user.token.storage.regex,
        message: Config.user.token.storage.msg
      },
    ]);

    let db = await DB;
    let storage: IStorageDB | null = await db.collection("storages")
      .findOne(this.createStorageFindQuery(token, name));
    if (storage === null) {
      throw new AtNotFoundError("ストレージが見つかりません");
    }
    return storage.value;
  }

  static async setStorage(token: IAuthToken, name: string, value: string): Promise<void> {
    paramsErrorMaker([
      {
        field: "name",
        val: name,
        regex: Config.user.token.storage.regex,
        message: Config.user.token.storage.msg
      },
    ]);

    let db = await DB;

    let data: IStorageDB = {
      user: token.user,
      client: token.type === 'general' ? token.client : null,
      key: name,
      value
    }
    await db.collection("storages")
      .update(this.createStorageFindQuery(token, name), data, { upsert: true });
  }

  static async deleteStorage(token: IAuthToken, name: string): Promise<void> {
    paramsErrorMaker([
      {
        field: "name",
        val: name,
        regex: Config.user.token.storage.regex,
        message: Config.user.token.storage.msg
      },
    ]);

    let db = await DB;

    let r = await db.collection("storages")
      .deleteOne(this.createStorageFindQuery(token, name));
    if (r.deletedCount !== 1) {
      throw new AtNotFoundError("ストレージが見つかりません");
    }
  }

  static async listStorage(token: IAuthToken): Promise<string[]> {
    let db = await DB;
    let ls: IStorageDB[] = await db.collection("storages")
      .find(this.createStorageFindQuery(token, null))
      .toArray();
    return ls.map(s => s.key);
  }
}