import { IAuthTokenMaster } from "../../auth";
import { Client } from "./client";

export interface IClientRepo {
  findOne(id: string): Promise<Client>;
  findIn(ids: string[]): Promise<Client[]>;
  findAll(authToken: IAuthTokenMaster): Promise<Client[]>;
  insert(client: Client): Promise<void>;
  update(client: Client): Promise<void>;
  find(authToken: IAuthTokenMaster | null, query: {
    id?: string[],
    self?: boolean,
  }): Promise<Client[]>;
}
