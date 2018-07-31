import { IAuthToken } from "../../auth";
import { DateType } from "../../server";
import { Msg } from "./msg";
export interface IMsgRepo {
  findOne(id: string): Promise<Msg>;
  insert(msg: Msg): Promise<void>;
  update(msg: Msg): Promise<void>;
  find2(
    authToken: IAuthToken,
    query: {
      date?: DateType,
      id?: string[],
    },
    limit: number): Promise<Msg[]>;
}
