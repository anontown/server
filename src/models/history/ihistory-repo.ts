import { Topic } from "../topic";
import { History } from "./history";

export interface IHistoryRepo {
  insert(history: History): Promise<void>;
  update(history: History): Promise<void>;
  findOne(id: string): Promise<History>;
  findIn(ids: string[]): Promise<History[]>;
  findAll(topic: Topic): Promise<History[]>;
}
