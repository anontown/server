import { DateType } from "../../server";
import { History } from "./history";
import * as G from "../../generated/graphql";


export interface IHistoryRepo {
  insert(history: History): Promise<void>;
  update(history: History): Promise<void>;
  findOne(id: string): Promise<History>;
  find(query: G.HistoryQuery, limit: number): Promise<History[]>;
}
