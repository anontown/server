import { ObjectID, WriteError } from 'mongodb';
import { DB } from '../../db';
import { AtNotFoundError, AtConflictError, paramsErrorMaker } from '../../at-error'
import * as fs from 'fs-promise';
import { Token, ITokenDB, TokenGeneral, TokenMaster } from './token';
import { IAuthTokenMaster, IAuthToken } from '../../auth';
import { Config } from '../../config';

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

    await fs.mkdir("./storage/" + token.id.toString());

    return null;
  }

  static async update(token: Token): Promise<null> {
    let db = await DB;
    await db.collection("tokens").update({ _id: token.id }, token.toDB());
    return null;
  }

  private static getStorageFilePath(token: IAuthToken, name: string) {
    return "./storage/" + token.id.toString() + "/st-" + name;
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
    try {
      return await fs.readFile(this.getStorageFilePath(token, name), { encoding: "utf-8" });
    } catch (_e) {
      throw new AtNotFoundError("ストレージが見つかりません");
    }
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

    try {
      await fs.writeFile(this.getStorageFilePath(token, name), value, { encoding: "utf-8" });
    } catch (_e) {
      throw new Error();
    }
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

    try {
      await fs.unlink(this.getStorageFilePath(token, name))
    } catch (_e) {
      throw new AtNotFoundError("ストレージが見つかりません");
    }
  }

  static async listStorage(token: IAuthToken): Promise<string[]> {
    try {
      let ls = await fs.readdir("./storage/" + token.id.toString() + "/");
      return ls.map(s => s.substring(4));
    } catch (_e) {
      throw new Error();
    }
  }
}