import { History } from "./history";

export interface IHistoryRepo {
  insert(history: History): Promise<void>;
  update(history: History): Promise<void>;
  findOne(id: string): Promise<History>;
  find(query: { id?: string[], topic?: string[] }): Promise<History[]>;
}
