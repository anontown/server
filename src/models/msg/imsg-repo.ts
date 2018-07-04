import { IAuthToken } from "../../auth";
import { Msg } from "./msg";
import { DateType } from "../../server";
export interface IMsgRepo {
  findOne(id: string): Promise<Msg>;
  findIn(ids: string[]): Promise<Msg[]>;
  find(
    authToken: IAuthToken,
    type: "gt" | "gte" | "lt" | "lte",
    date: Date,
    limit: number): Promise<Msg[]>;
  insert(msg: Msg): Promise<void>;
  update(msg: Msg): Promise<void>;
  find2(
    authToken: IAuthToken,
    query: {
      date: DateType | null,
      id: string[] | null
    },
    limit: number): Promise<Msg[]>;
}
