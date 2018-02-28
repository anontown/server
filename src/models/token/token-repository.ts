import { ObjectID, WriteError } from "mongodb";
import { AtConflictError, AtNotFoundError, paramsErrorMaker } from "../../at-error";
import { IAuthToken, IAuthTokenMaster, IAuthUser } from "../../auth";
import { Config } from "../../config";
import { DB } from "../../db";
import { Client, ClientRepo } from "../client";
import { ITokenDB, Token, TokenGeneral, TokenMaster } from "./token";

export interface IStorageDB {
  client: ObjectID | null;
  user: ObjectID;
  key: string;
  value: string;
}

export class TokenRepo {
  static async findOne(id: string): Promise<Token> {
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

  static async findAll(authToken: IAuthTokenMaster): Promise<Token[]> {
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

  static async insert(token: Token): Promise<null> {
    const db = await DB;
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
    const db = await DB;
    await db.collection("tokens").update({ _id: new ObjectID(token.id) }, token.toDB());
    return null;
  }

  static async getStorage(token: IAuthToken, name: string): Promise<string> {
    paramsErrorMaker([
      {
        field: "name",
        val: name,
        regex: Config.user.token.storage.regex,
        message: Config.user.token.storage.msg,
      },
    ]);

    const db = await DB;
    const storage: IStorageDB | null = await db.collection("storages")
      .findOne(TokenRepo.createStorageFindQuery(token, name));
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
        message: Config.user.token.storage.msg,
      },
    ]);

    const db = await DB;

    const data: IStorageDB = {
      user: new ObjectID(token.user),
      client: token.type === "general" ? new ObjectID(token.client) : null,
      key: name,
      value,
    };
    await db.collection("storages")
      .update(TokenRepo.createStorageFindQuery(token, name), data, { upsert: true });
  }

  static async deleteStorage(token: IAuthToken, name: string): Promise<void> {
    paramsErrorMaker([
      {
        field: "name",
        val: name,
        regex: Config.user.token.storage.regex,
        message: Config.user.token.storage.msg,
      },
    ]);

    const db = await DB;

    const r = await db.collection("storages")
      .deleteOne(TokenRepo.createStorageFindQuery(token, name));
    if (r.deletedCount !== 1) {
      throw new AtNotFoundError("ストレージが見つかりません");
    }
  }

  static async listStorage(token: IAuthToken): Promise<string[]> {
    const db = await DB;
    const ls: IStorageDB[] = await db.collection("storages")
      .find(TokenRepo.createStorageFindQuery(token, null))
      .toArray();
    return ls.map(s => s.key);
  }

  static async listClient(token: IAuthTokenMaster): Promise<Client[]> {
    const tokens = await TokenRepo.findAll(token);
    const clientIds = Array.from(new Set((tokens
      .map(t => t.type === "general" ? t.client.toString() : null)
      .filter<string>((x): x is string => x !== null))));
    return await ClientRepo.findIn(clientIds);
  }

  static async delClientToken(token: IAuthTokenMaster, client: Client): Promise<void> {
    const db = await DB;
    await db.collection("tokens")
      .remove({ user: new ObjectID(token.user), client: new ObjectID(client.id) });
  }

  static async delMasterToken(user: IAuthUser): Promise<void> {
    const db = await DB;
    await db.collection("tokens")
      .remove({ user: new ObjectID(user.id), type: "master" });
  }

  private static createStorageFindQuery(token: IAuthToken, name: string | null) {
    const q = {
      user: new ObjectID(token.user),
      client: token.type === "general" ? new ObjectID(token.client) : null,
    };
    if (name !== null) {
      return { ...q, key: name };
    } else {
      return q;
    }
  }
}
