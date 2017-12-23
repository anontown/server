import { User } from '../user';
import { IGenerator } from '../../generator';
import { IAuthToken } from "../../auth";
import { AtRightError } from "../../at-error";

export interface IMsgDB {
  id: string,
  body: {
    receiver: string | null,
    body: string,
    date: string
  }
}

export interface IMsgAPI {
  id: string,
  receiver: string | null,
  body: string,
  date: string
}

export class Msg {
  private constructor(private _id: string,
    private _receiver: string | null,
    private _body: string,
    private _date: Date) {

  }

  get id() {
    return this._id;
  }

  get receiver() {
    return this._receiver;
  }

  get body() {
    return this._body;
  }

  get date() {
    return this._date;
  }

  toDB(): IMsgDB {
    return {
      id: this._id,
      body: {
        receiver: this._receiver,
        body: this._body,
        date: this._date.toISOString()
      }
    }
  }

  toAPI(authToken: IAuthToken): IMsgAPI {
    if (this._receiver !== null && this._receiver !== authToken.user) {
      throw new AtRightError("アクセス権がありません。");
    }

    return {
      id: this._id,
      receiver: this._receiver,
      body: this._body,
      date: this._date.toISOString()
    }
  }

  static fromDB(m: IMsgDB): Msg {
    return new Msg(m.id, m.body.receiver, m.body.body, new Date(m.body.date));
  }

  static create(objidGenerator: IGenerator<string>, receiver: User | null, body: string, now: Date): Msg {
    return new Msg(objidGenerator.get(),
      receiver !== null ? receiver.id : null,
      body,
      now);
  }
}