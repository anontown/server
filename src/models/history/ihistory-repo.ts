import { Topic } from "../topic";
import { History } from "./history";

export interface IHistoryRepo {
  insert(history: History): Promise<null>;
  update(history: History): Promise<null>;
  findOne(id: string): Promise<History>;
  findIn(ids: string[]): Promise<History[]>;
  findAll(topic: Topic): Promise<History[]>;
}
