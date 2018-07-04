import { History } from "./history";

export interface IHistoryRepo {
  insert(history: History): Promise<void>;
  update(history: History): Promise<void>;
  findOne(id: string): Promise<History>;
  findIn(ids: string[]): Promise<History[]>;
  findAll(topicID: string): Promise<History[]>;
  find(query: { id: string[] | null, topic: string[] | null }): Promise<History[]>;
}
