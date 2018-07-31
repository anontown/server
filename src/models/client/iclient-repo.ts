import { IAuthTokenMaster } from "../../auth";
import { Client } from "./client";

export interface ClientQuery {
  id?: string[],
  self?: boolean,
}

export interface IClientRepo {
  findOne(id: string): Promise<Client>;
  insert(client: Client): Promise<void>;
  update(client: Client): Promise<void>;
  find(authToken: IAuthTokenMaster | null, query: ClientQuery): Promise<Client[]>;
}
