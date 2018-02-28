import { Topic, TopicNormal } from "./topic";

export interface ITopicRepo {
  findOne(id: string): Promise<Topic>;

  findIn(ids: string[]): Promise<Topic[]>;

  findTags(limit: number): Promise<Array<{ name: string, count: number }>>;

  find(
    titles: string[],
    tags: string[],
    skip: number,
    limit: number,
    activeOnly: boolean): Promise<Topic[]>;

  findFork(parent: TopicNormal, skip: number, limit: number, activeOnly: boolean): Promise<Topic[]>;

  cron(): void;

  insert(topic: Topic): Promise<null>;

  update(topic: Topic): Promise<null>;
}
