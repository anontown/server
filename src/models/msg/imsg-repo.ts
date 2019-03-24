import { IAuthToken } from "../../auth";
import { DateType } from "../../server";
import { Msg } from "./msg";
import * as G from "../../generated/graphql";

export interface IMsgRepo {
  findOne(id: string): Promise<Msg>;
  insert(msg: Msg): Promise<void>;
  update(msg: Msg): Promise<void>;
  find(
    authToken: IAuthToken,
    query: G.MsgQuery,
    limit: number): Promise<Msg[]>;
}
