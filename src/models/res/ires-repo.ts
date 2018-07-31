import { Subject } from "rxjs";
import { AuthContainer } from "../../server/auth-container";
import { DateType } from "../../server/index";
import { Res } from "./res";

export interface IResRepo {
  readonly insertEvent: Subject<{ res: Res, count: number }>;

  findOne(id: string): Promise<Res>;

  insert(res: Res): Promise<void>;

  update(res: Res): Promise<void>;

  resCount(topicIDs: string[]): Promise<Map<string, number>>;

  replyCount(resIDs: string[]): Promise<Map<string, number>>;

  find(
    auth: AuthContainer,
    query: {
      id?: string[],
      topic?: string,
      notice?: boolean,
      hash?: string,
      reply?: string,
      profile?: string,
      text?: string,
      self?: boolean,
      date?: DateType,
    },
    limit: number): Promise<Res[]>;
}
