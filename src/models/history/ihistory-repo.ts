import * as G from "../../generated/graphql";
import { DateType } from "../../server";
import { History } from "./history";

export interface IHistoryRepo {
  insert(history: History): Promise<void>;
  update(history: History): Promise<void>;
  findOne(id: string): Promise<History>;
  find(query: G.HistoryQuery, limit: number): Promise<History[]>;
}
