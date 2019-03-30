import * as G from "../../generated/graphql";
import { IResRepo } from "../res";
import { Topic } from "./topic";

export interface ITopicRepo {
  resRepo: IResRepo;

  findOne(id: string): Promise<Topic>;

  findTags(limit: number): Promise<{ name: string, count: number }[]>;

  cron(): void;

  insert(topic: Topic): Promise<void>;

  update(topic: Topic): Promise<void>;

  cronTopicCheck(now: Date): Promise<void>;

  find(
    query: G.TopicQuery,
    skip: number,
    limit: number): Promise<Topic[]>;
}
