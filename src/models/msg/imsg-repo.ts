import { IAuthToken } from "../../auth";
import { DateType } from "../../server";
import { Msg } from "./msg";

export interface MsgQuery {
  date?: DateType;
  id?: string[];
}

export interface IMsgRepo {
  findOne(id: string): Promise<Msg>;
  insert(msg: Msg): Promise<void>;
  update(msg: Msg): Promise<void>;
  find(
    authToken: IAuthToken,
    query: MsgQuery,
    limit: number): Promise<Msg[]>;
}
