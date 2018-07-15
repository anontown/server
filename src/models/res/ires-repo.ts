import { Subject } from "rxjs";
import { IAuthToken } from "../../auth";
import { AuthContainer } from "../../server/auth-container";
import { DateType } from "../../server/index";
import { Res } from "./res";

export interface IResFindQuery {
  topic?: string;
  notice?: boolean;
  hash?: string;
  reply?: string;
  profile?: string;
  self?: boolean;
  text?: string;
}

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

  find2(auth: AuthContainer, query: {
    id: string[] | null,
    topic: string | null,
    notice: boolean | null,
    hash: string | null,
    reply: string | null,
    profile: string | null,
    text: string | null,
    self: boolean | null,
    date: DateType | null,
  },    limit: number): Promise<Res[]>;
}
