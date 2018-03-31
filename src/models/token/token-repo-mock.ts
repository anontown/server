import { ObjectID } from "mongodb";
import { AtNotFoundError, paramsErrorMaker } from "../../at-error";
import { IAuthToken, IAuthTokenMaster, IAuthUser } from "../../auth";
import { Config } from "../../config";
import { Client, IClientRepo } from "../client";
import { IStorageDB, ITokenRepo } from "./itoken-repo";
import { ITokenDB, Token, TokenGeneral, TokenMaster } from "./token";

export class TokenRepoMock implements ITokenRepo {
  private tokens: ITokenDB[] = [];
  private storages: IStorageDB[] = [];

  constructor(private clientRepo: IClientRepo) { }

  async findOne(id: string): Promise<Token> {
    const token = this.tokens.find(x => x._id.toHexString() === id);
    if (token === undefined) {
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
    const tokens = this.tokens
      .filter(x => x.user.toHexString() === authToken.user)
      .sort((a, b) => b.date.valueOf() - a.date.valueOf());

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
    this.tokens.push(token.toDB());
  }

  async update(token: Token): Promise<void> {
    this.tokens[this.tokens.findIndex(x => x._id.toHexString() === token.id)] = token.toDB();
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

    const storage = this.storages.find(this.createStorageFindQuery(token, name));

    if (storage === undefined) {
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

    const data: IStorageDB = {
      user: new ObjectID(token.user),
      client: token.type === "general" ? new ObjectID(token.client) : null,
      key: name,
      value,
    };

    const index = this.storages.findIndex(this.createStorageFindQuery(token, name));
    if (index === -1) {
      this.storages.push(data);
    } else {
      this.storages[index] = data;
    }
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

    const index = this.storages.findIndex(this.createStorageFindQuery(token, name));
    if (index === -1) {
      throw new AtNotFoundError("ストレージが見つかりません");
    } else {
      this.storages.splice(index, 1);
    }
  }

  async listStorage(token: IAuthToken): Promise<string[]> {
    return this.storages
      .filter(this.createStorageFindQuery(token, null))
      .map(x => x.key);
  }

  async listClient(token: IAuthTokenMaster): Promise<Client[]> {
    const tokens = await this.findAll(token);
    const clientIds = Array.from(new Set((tokens
      .map(t => t.type === "general" ? t.client.toString() : null)
      .filter<string>((x): x is string => x !== null))));
    return await this.clientRepo.findIn(clientIds);
  }

  async delClientToken(token: IAuthTokenMaster, client: Client): Promise<void> {
    this.tokens = this.tokens.filter(x => !(x.user.toHexString() === token.user
      && x.type === "general"
      && x.client.toHexString() === client.id));
  }

  async delMasterToken(user: IAuthUser): Promise<void> {
    this.tokens = this.tokens.filter(x => !(x.user.toHexString() === user.id
      && x.type === "master"));
  }

  private createStorageFindQuery(token: IAuthToken, name: string | null) {
    return (x: IStorageDB) => x.user.toHexString() === token.user
      && x.client === (token.type === "general" ? token.client : null)
      && (name === null || x.key === name);
  }
}
