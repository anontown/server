import { ObjectID } from 'mongodb';
import { User } from '../user';
import { StringUtil } from '../../util';
import { IGenerator } from '../../generator';

export interface IMsgDB {
  _id: ObjectID,
  receiver: ObjectID | null,
  text: string,
  mdtext: string,
  date: Date
}

export interface IMsgAPI {
  id: string,
  receiver: string | null,
  text: string,
  mdtext: string,
  date: string
}

export class Msg {
  private constructor(private _id: ObjectID,
    private _receiver: ObjectID | null,
    private _text: string,
    private _mdtext: string,
    private _date: Date) {

  }

  get id() {
    return this._id;
  }

  get receiver() {
    return this._receiver;
  }

  get text(){
    return this._text;
  }

  get mdtext(){
    return this._mdtext;
  }

  get date(){
    return this._date;
  }

  toDB(): IMsgDB {
    return {
      _id: this._id,
      receiver: this._receiver,
      text: this._text,
      mdtext: this._mdtext,
      date: this._date
    }
  }

  toAPI(): IMsgAPI {
    return {
      id: this._id.toString(),
      receiver: this._receiver !== null ? this._receiver.toString() : null,
      text: this._text,
      mdtext: this._mdtext,
      date: this._date.toISOString()
    }
  }

  static fromDB(m: IMsgDB): Msg {
    return new Msg(m._id, m.receiver, m.text, m.mdtext, m.date);
  }

  static create(objidGenerator: IGenerator<ObjectID>, receiver: User | null, text: string, now: Date): Msg {
    return new Msg(objidGenerator.get(),
      receiver !== null ? receiver.id : null,
      text,
      StringUtil.md(text),
      now);
  }
}