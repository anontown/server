import { ObjectID } from 'mongodb';
import { User } from '../user';
import { IGenerator } from '../../generator';

export interface IMsgDB {
  _id: ObjectID,
  receiver: ObjectID | null,
  body: string,
  date: Date
}

export interface IMsgAPI {
  id: string,
  receiver: string | null,
  body: string,
  date: string
}

export class Msg {
  private constructor(private _id: ObjectID,
    private _receiver: ObjectID | null,
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
      _id: this._id,
      receiver: this._receiver,
      body: this._body,
      date: this._date
    }
  }

  toAPI(): IMsgAPI {
    return {
      id: this._id.toString(),
      receiver: this._receiver !== null ? this._receiver.toString() : null,
      body: this._body,
      date: this._date.toISOString()
    }
  }

  static fromDB(m: IMsgDB): Msg {
    return new Msg(m._id, m.receiver, m.body, m.date);
  }

  static create(objidGenerator: IGenerator<ObjectID>, receiver: User | null, body: string, now: Date): Msg {
    return new Msg(objidGenerator.get(),
      receiver !== null ? receiver.id : null,
      body,
      now);
  }
}