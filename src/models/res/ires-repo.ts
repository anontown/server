import { Subject } from "rxjs";
import { IAuthToken } from "../../auth";
import { Topic } from "../topic";
import { Res } from "./res";

export interface IResRepo {
  readonly insertEvent: Subject<{ res: Res, count: number }>;

  findOne(id: string): Promise<Res>;

  findIn(ids: string[]): Promise<Res[]>;

  find(topic: Topic, type: "before" | "after", equal: boolean, date: Date, limit: number): Promise<Res[]>;

  findNew(topic: Topic, limit: number): Promise<Res[]>;

  findNotice(
    authToken: IAuthToken,
    type: "before" | "after",
    equal: boolean,
    date: Date,
    limit: number): Promise<Res[]>;

  findNoticeNew(authToken: IAuthToken, limit: number): Promise<Res[]>;

  findHash(hash: string): Promise<Res[]>;

  findReply(res: Res): Promise<Res[]>;

  insert(res: Res): Promise<void>;

  update(res: Res): Promise<void>;

  resCount(topicIDs: string[]): Promise<Map<string, number>>;
}
