import { ObjectID, WriteError } from "mongodb";
import { AtConflictError, AtNotFoundError, paramsErrorMaker } from "../../at-error";
import { IAuthToken, IAuthTokenMaster, IAuthUser } from "../../auth";
import { Config } from "../../config";
import { DB } from "../../db";
import { Client, IClientRepo } from "../client";
import { IStorageDB, ITokenRepo } from "./itoken-repo";
import { ITokenDB, Token, TokenGeneral, TokenMaster } from "./token";

export class TokenRepo implements ITokenRepo {
  constructor(private clientRepo: IClientRepo) { }

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

  async insert(token: Token): Promise<null> {
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

  async update(token: Token): Promise<null> {
    const db = await DB;
    await db.collection("tokens").update({ _id: new ObjectID(token.id) }, token.toDB());
    return null;
  }

  async getStorage(token: IAuthToken, name: string): Promise<string> {
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
      .findOne(this.createStorageFindQuery(token, name));
    if (storage === null) {
      throw new AtNotFoundError("ストレージが見つかりません");
    }
    return storage.value;
  }

  async setStorage(token: IAuthToken, name: string, value: string): Promise<void> {
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
      .update(this.createStorageFindQuery(token, name), data, { upsert: true });
  }

  async deleteStorage(token: IAuthToken, name: string): Promise<void> {
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
      .deleteOne(this.createStorageFindQuery(token, name));
    if (r.deletedCount !== 1) {
      throw new AtNotFoundError("ストレージが見つかりません");
    }
  }

  async listStorage(token: IAuthToken): Promise<string[]> {
    const db = await DB;
    const ls: IStorageDB[] = await db.collection("storages")
      .find(this.createStorageFindQuery(token, null))
      .toArray();
    return ls.map(s => s.key);
  }

  async listClient(token: IAuthTokenMaster): Promise<Client[]> {
    const tokens = await this.findAll(token);
    const clientIds = Array.from(new Set((tokens
      .map(t => t.type === "general" ? t.client.toString() : null)
      .filter<string>((x): x is string => x !== null))));
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

  private createStorageFindQuery(token: IAuthToken, name: string | null) {
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
