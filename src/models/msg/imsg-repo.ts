import { IAuthToken } from "../../auth";
import { Msg } from "./msg";
export interface IMsgRepo {
  findOne(id: string): Promise<Msg>;
  findIn(ids: string[]): Promise<Msg[]>;
  find(
    authToken: IAuthToken,
    type: "before" | "after",
    equal: boolean,
    date: Date,
    limit: number): Promise<Msg[]>;
  findNew(authToken: IAuthToken, limit: number): Promise<Msg[]>;
  insert(msg: Msg): Promise<void>;
  update(msg: Msg): Promise<void>;
}
