import { Subject } from "rxjs";
import { IAuthToken } from "../../auth";
import { Res } from "./res";

export interface IResRepo {
  readonly insertEvent: Subject<{ res: Res, count: number }>;

  findOne(id: string): Promise<Res>;

  findIn(ids: string[]): Promise<Res[]>;

  find(topic: string, type: "before" | "after", equal: boolean, date: Date, limit: number): Promise<Res[]>;

  findNew(topicID: string, limit: number): Promise<Res[]>;

  findNotice(
    authToken: IAuthToken,
    type: "before" | "after",
    equal: boolean,
    date: Date,
    limit: number): Promise<Res[]>;

  findNoticeNew(authToken: IAuthToken, limit: number): Promise<Res[]>;

  findHash(hash: string): Promise<Res[]>;

  findReply(resID: string): Promise<Res[]>;

  insert(res: Res): Promise<void>;

  update(res: Res): Promise<void>;

  resCount(topicIDs: string[]): Promise<Map<string, number>>;
}
