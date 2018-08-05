import { DateType } from "../../server";
import { History } from "./history";

export interface HistoryQuery {
  id?: string[];
  topic?: string[];
  date?: DateType;
}

export interface IHistoryRepo {
  insert(history: History): Promise<void>;
  update(history: History): Promise<void>;
  findOne(id: string): Promise<History>;
  find(query: HistoryQuery, limit: number): Promise<History[]>;
}
