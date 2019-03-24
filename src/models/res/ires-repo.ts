import { Subject } from "rxjs";
import { AuthContainer } from "../../server/auth-container";
import { Res } from "./res";
import * as G from "../../generated/graphql";

export interface IResRepo {
  readonly insertEvent: Subject<{ res: Res, count: number }>;

  findOne(id: string): Promise<Res>;

  insert(res: Res): Promise<void>;

  update(res: Res): Promise<void>;

  resCount(topicIDs: string[]): Promise<Map<string, number>>;

  replyCount(resIDs: string[]): Promise<Map<string, number>>;

  find(
    auth: AuthContainer,
    query: G.ResQuery,
    limit: number): Promise<Res[]>;
}
