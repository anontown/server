import { IAuthTokenMaster, IAuthUser } from "../../auth";
import { Client } from "../client";
import { Token } from "./token";

export interface ITokenRepo {
  findOne(id: string): Promise<Token>;

  findAll(authToken: IAuthTokenMaster): Promise<Token[]>;

  insert(token: Token): Promise<void>;

  update(token: Token): Promise<void>;

  delClientToken(token: IAuthTokenMaster, client: Client): Promise<void>;

  delMasterToken(user: IAuthUser): Promise<void>;
}
