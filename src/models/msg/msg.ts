import { AtRightError } from "../../at-error";
import { IAuthToken } from "../../auth";
import { IGenerator } from "../../generator";
import { User } from "../user";
import Copyable from "ts-copyable";

export interface IMsgDB {
  readonly id: string;
  readonly body: {
    readonly receiver: string | null,
    readonly body: string,
    readonly date: string,
  };
}

export interface IMsgAPI {
  readonly id: string;
  readonly receiver: string | null;
  readonly body: string;
  readonly date: string;
}

export class Msg extends Copyable<Msg>{
  static fromDB(m: IMsgDB): Msg {
    return new Msg(m.id, m.body.receiver, m.body.body, new Date(m.body.date));
  }

  static create(objidGenerator: IGenerator<string>, receiver: User | null, body: string, now: Date): Msg {
    return new Msg(objidGenerator.get(),
      receiver !== null ? receiver.id : null,
      body,
      now);
  }

  constructor(
    public readonly id: string,
    public readonly receiver: string | null,
    public readonly body: string,
    public readonly date: Date) {
    super(Msg);
  }

  toDB(): IMsgDB {
    return {
      id: this.id,
      body: {
        receiver: this.receiver,
        body: this.body,
        date: this.date.toISOString(),
      },
    };
  }

  toAPI(authToken: IAuthToken): IMsgAPI {
    if (this.receiver !== null && this.receiver !== authToken.user) {
      throw new AtRightError("アクセス権がありません。");
    }

    return {
      id: this.id,
      receiver: this.receiver,
      body: this.body,
      date: this.date.toISOString(),
    };
  }
}
