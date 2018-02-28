import { ObjectID } from "mongodb";
import { IAuthToken, IAuthTokenMaster, IAuthUser } from "../../auth";
import { Client } from "../client";
import { Token } from "./token";

export interface IStorageDB {
  client: ObjectID | null;
  user: ObjectID;
  key: string;
  value: string;
}

export interface ITokenRepo {
  findOne(id: string): Promise<Token>;

  findAll(authToken: IAuthTokenMaster): Promise<Token[]>;

  insert(token: Token): Promise<null>;

  update(token: Token): Promise<null>;

  getStorage(token: IAuthToken, name: string): Promise<string>;

  setStorage(token: IAuthToken, name: string, value: string): Promise<void>;

  deleteStorage(token: IAuthToken, name: string): Promise<void>;

  listStorage(token: IAuthToken): Promise<string[]>;

  listClient(token: IAuthTokenMaster): Promise<Client[]>;

  delClientToken(token: IAuthTokenMaster, client: Client): Promise<void>;

  delMasterToken(user: IAuthUser): Promise<void>;
}
