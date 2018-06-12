import { Subject } from "rxjs";
import { IAuthToken } from "../../auth";
import { Res } from "./res";

export interface IResFindQuery {
  topic: string | null,
  notice: boolean,
  hash: string | null,
  reply: string | null
};

export interface IResRepo {
  readonly insertEvent: Subject<{ res: Res, count: number }>;

  findOne(id: string): Promise<Res>;

  findIn(ids: string[]): Promise<Res[]>;

  find(
    query: IResFindQuery,
    authToken: IAuthToken | null,
    type: "gt" | "gte" | "lt" | "lte",
    date: Date,
    limit: number): Promise<Res[]>;

  insert(res: Res): Promise<void>;

  update(res: Res): Promise<void>;

  resCount(topicIDs: string[]): Promise<Map<string, number>>;

  replyCount(resIDs: string[]): Promise<Map<string, number>>;
}
