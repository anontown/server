import { IAuthTokenMaster, IAuthUser } from "../../auth";
import { Client, IClientRepo } from "../client";
import { Token } from "./token";

export interface ITokenRepo {
  clientRepo: IClientRepo;

  findOne(id: string): Promise<Token>;

  findAll(authToken: IAuthTokenMaster): Promise<Token[]>;

  insert(token: Token): Promise<void>;

  update(token: Token): Promise<void>;

  listClient(token: IAuthTokenMaster): Promise<Client[]>;

  delClientToken(token: IAuthTokenMaster, client: Client): Promise<void>;

  delMasterToken(user: IAuthUser): Promise<void>;
}
