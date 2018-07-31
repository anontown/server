import { History } from "./history";

export interface HistoryQuery {
  id?: string[],
  topic?: string[]
}

export interface IHistoryRepo {
  insert(history: History): Promise<void>;
  update(history: History): Promise<void>;
  findOne(id: string): Promise<History>;
  find(query: HistoryQuery): Promise<History[]>;
}
