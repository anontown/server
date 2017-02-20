import { ObjectID, WriteError } from 'mongodb';
import { DB } from '../../db';
import { AtError, StatusCode } from '../../at-error'
import * as fs from 'fs-promise';
import { Token, ITokenDB } from './token';
import { IAuthUser } from '../../auth';

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
}