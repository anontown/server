import { ObjectID } from "mongodb";
import { AtNotFoundError } from "../../at-error";
import { IAuthTokenMaster, IAuthUser } from "../../auth";
import { DB } from "../../db";
import { Client, IClientRepo } from "../client";
import { ITokenRepo } from "./itoken-repo";
import { ITokenDB, Token, TokenGeneral, TokenMaster } from "./token";

export class TokenRepo implements ITokenRepo {
  constructor(public clientRepo: IClientRepo) { }

  async findOne(id: string): Promise<Token> {
    const db = await DB;
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
    const db = await DB;
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
    const db = await DB;
    await db.collection("tokens").insert(token.toDB());
  }

  async update(token: Token): Promise<void> {
    const db = await DB;
    await db.collection("tokens").update({ _id: new ObjectID(token.id) }, token.toDB());
  }

  async listClient(token: IAuthTokenMaster): Promise<Client[]> {
    const tokens = await this.findAll(token);
    const clientIds = [...new Set((tokens
      .map(t => t.type === "general" ? t.client.toString() : null)
      .filter<string>((x): x is string => x !== null)))];
    return await this.clientRepo.findIn(clientIds);
  }

  async delClientToken(token: IAuthTokenMaster, client: Client): Promise<void> {
    const db = await DB;
    await db.collection("tokens")
      .remove({ user: new ObjectID(token.user), client: new ObjectID(client.id) });
  }

  async delMasterToken(user: IAuthUser): Promise<void> {
    const db = await DB;
    await db.collection("tokens")
      .remove({ user: new ObjectID(user.id), type: "master" });
  }
}
