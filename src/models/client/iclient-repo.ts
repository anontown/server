import { Option } from "fp-ts/lib/Option";
import { IAuthTokenMaster } from "../../auth";
import * as G from "../../generated/graphql";
import { Client } from "./client";

export interface IClientRepo {
  findOne(id: string): Promise<Client>;
  insert(client: Client): Promise<void>;
  update(client: Client): Promise<void>;
  find(authToken: Option<IAuthTokenMaster>, query: G.ClientQuery): Promise<Client[]>;
}
