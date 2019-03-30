import { IAuthToken } from "../../auth";
import * as G from "../../generated/graphql";
import { DateType } from "../../server";
import { Msg } from "./msg";

export interface IMsgRepo {
  findOne(id: string): Promise<Msg>;
  insert(msg: Msg): Promise<void>;
  update(msg: Msg): Promise<void>;
  find(
    authToken: IAuthToken,
    query: G.MsgQuery,
    limit: number): Promise<Msg[]>;
}
