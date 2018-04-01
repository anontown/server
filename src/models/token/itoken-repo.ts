import { IAuthTokenMaster, IAuthUser } from "../../auth";
import { Token } from "./token";

export interface ITokenRepo {
  findOne(id: string): Promise<Token>;

  findAll(authToken: IAuthTokenMaster): Promise<Token[]>;

  insert(token: Token): Promise<void>;

  update(token: Token): Promise<void>;

  delClientToken(token: IAuthTokenMaster, clientID: string): Promise<void>;

  delMasterToken(user: IAuthUser): Promise<void>;
}
