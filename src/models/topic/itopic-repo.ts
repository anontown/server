import { IResRepo } from "../res";
import { Topic } from "./topic";

export interface ITopicRepo {
  resRepo: IResRepo;

  findOne(id: string): Promise<Topic>;

  findIn(ids: string[]): Promise<Topic[]>;

  findTags(limit: number): Promise<{ name: string, count: number }[]>;

  find(
    title: string,
    tags: string[],
    skip: number,
    limit: number,
    activeOnly: boolean): Promise<Topic[]>;

  findFork(parentID: string, skip: number, limit: number, activeOnly: boolean): Promise<Topic[]>;

  cron(): void;

  insert(topic: Topic): Promise<void>;

  update(topic: Topic): Promise<void>;

  cronTopicCheck(now: Date): Promise<void>;

  find2(query: {
    id?: string[],
    title?: string,
    tags?: string[],
    activeOnly?: boolean,
    parent?: string,
  },    skip: number, limit: number): Promise<Topic[]>;
}
