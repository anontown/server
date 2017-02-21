import { ObjectID, WriteError } from 'mongodb';
import { DB } from '../../db';
import { AtError, StatusCode } from '../../at-error'
import * as fs from 'fs-promise';
import { Token, ITokenDB } from './token';
import { IAuthUser,IAuthToken } from '../../auth';
import { Config } from '../../config';

export class TokenRepository {
  static async findOne(id: ObjectID): Promise<Token> {
    let db = await DB;
    let token: ITokenDB | null = await db.collection("tokens").findOne({ _id: id });
    if (token === null) {
      throw new AtError(StatusCode.NotFound, "トークンが存在しません");
    }

    return Token.fromDB(token);
  }

  static async findAll(authUser: IAuthUser): Promise<Token[]> {
    let db = await DB;
    let tokens: ITokenDB[] = await db.collection("tokens")
      .find({ user: authUser.id })
      .sort({ date: -1 })
      .toArray();

    return tokens.map(t => Token.fromDB(t));
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
    await db.collection("tokens").update({ _id: token.id }, token.toDB());
    return null;
  }

  private static getStorageFilePath(token:IAuthToken,name: string) {
    return "./storage/" + token.id.toString() + "/st-" + name;
  }

  static async getStorage(token:IAuthToken,name: string): Promise<string> {
    if (!name.match(Config.user.token.storage.regex)) {
      throw new AtError(StatusCode.MisdirectedRequest, Config.user.token.storage.msg);
    }
    try {
      return await fs.readFile(this.getStorageFilePath(token,name), { encoding: "utf-8" });
    } catch (_e) {
      throw new AtError(StatusCode.NotFound, "ストレージが見つかりません");
    }
  }

  static async setStorage(token:IAuthToken,name: string, value: string): Promise<void> {
    if (!name.match(Config.user.token.storage.regex)) {
      throw new AtError(StatusCode.MisdirectedRequest, Config.user.token.storage.msg);
    }

    try {
      await fs.writeFile(this.getStorageFilePath(token,name), value, { encoding: "utf-8" });
    } catch (_e) {
      throw new Error();
    }
  }

  static async deleteStorage(token:IAuthToken,name: string): Promise<void> {
    if (!name.match(Config.user.token.storage.regex)) {
      throw new AtError(StatusCode.MisdirectedRequest, Config.user.token.storage.msg);
    }

    try{
      await fs.unlink(this.getStorageFilePath(token,name))
    }catch(_e){
      throw new AtError(StatusCode.NotFound, "ストレージが見つかりません");
    }
  }

  static async listStorage(token:IAuthToken): Promise<string[]> {
    try{
      let ls=await fs.readdir("./storage/" + token.id.toString() + "/");
      return ls.map(s => s.substring(4));
    }catch(_e){
      throw new Error();
    }
  }
}