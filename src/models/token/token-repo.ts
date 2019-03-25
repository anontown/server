import { ObjectID } from "mongodb";
import { AtNotFoundError } from "../../at-error";
import { IAuthTokenMaster, IAuthUser } from "../../auth";
import { DB } from "../../db";
import { ITokenRepo } from "./itoken-repo";
import { ITokenDB, Token, TokenGeneral, TokenMaster } from "./token";

export class TokenRepo implements ITokenRepo {
  async findOne(id: string): Promise<Token> {
    const db = await DB();
    const token: ITokenDB | null = await db.collection("tokens").findOne({ _id: new ObjectID(id) });
    if (token === null) {
      throw new AtNotFoundError("トークンが存在しません");
    }

    switch (token.type) {
      case "general":
        return TokenGeneral.fromDB(token);
      case "master":
        return TokenMaster.fromDB(token);
    }
  }

  async findAll(authToken: IAuthTokenMaster): Promise<Token[]> {
    const db = await DB();
    const tokens: ITokenDB[] = await db.collection("tokens")
      .find({ user: new ObjectID(authToken.user) })
      .sort({ date: -1 })
      .toArray();

    return tokens.map(t => {
      switch (t.type) {
        case "general":
          return TokenGeneral.fromDB(t);
        case "master":
          return TokenMaster.fromDB(t);
      }
    });
  }

  async insert(token: Token): Promise<void> {
    const db = await DB();
    await db.collection("tokens").insert(token.toDB());
  }

  async update(token: Token): Promise<void> {
    const db = await DB();
    await db.collection("tokens").replaceOne({ _id: new ObjectID(token.id) }, token.toDB());
  }

  async delClientToken(token: IAuthTokenMaster, clientID: string): Promise<void> {
    const db = await DB();
    await db.collection("tokens")
      .remove({ user: new ObjectID(token.user), client: new ObjectID(clientID) });
  }

  async delMasterToken(user: IAuthUser): Promise<void> {
    const db = await DB();
    await db.collection("tokens")
      .remove({ user: new ObjectID(user.id), type: "master" });
  }
}
