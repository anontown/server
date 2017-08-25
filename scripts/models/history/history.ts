import { ObjectID } from 'mongodb';
import { User } from '../user';
import { TopicNormal } from '../topic';
import { IGenerator } from '../../generator';

export interface IHistoryDB {
  _id: ObjectID,
  topic: ObjectID,
  title: string,
  tags: string[],
  text: string,
  date: Date,
  hash: string,
  user: ObjectID
}

export interface IHistoryAPI {
  id: string,
  topic: string,
  title: string,
  tags: string[],
  text: string,
  date: string,
  hash: string
}

export class History {
  static fromDB(h: IHistoryDB): History {
    return new History(h._id, h.topic, h.title, h.tags, h.text, h.date, h.hash, h.user);
  }

  static create(objidGenerator: IGenerator<ObjectID>, topic: TopicNormal, date: Date, hash: string, user: User): History {
    return new History(objidGenerator.get(), topic.id, topic.title, topic.tags, topic.text, date, hash, user.id);
  }

  private constructor(private _id: ObjectID,
    private _topic: ObjectID,
    private _title: string,
    private _tags: string[],
    private _text: string,
    private _date: Date,
    private _hash: string,
    private _user: ObjectID) {

  }

  get id() {
    return this._id;
  }

  get topic() {
    return this._topic;
  }

  get title() {
    return this._title;
  }

  get tags() {
    return this._tags;
  }

  get text() {
    return this._text;
  }

  get date() {
    return this._date;
  }

  get hash() {
    return this._hash;
  }

  get user() {
    return this._user;
  }

  toDB(): IHistoryDB {
    return {
      _id: this._id,
      topic: this._topic,
      title: this._title,
      tags: this._tags,
      text: this._text,
      date: this._date,
      hash: this._hash,
      user: this._user
    }
  }

  toAPI(): IHistoryAPI {
    return {
      id: this._id.toString(),
      topic: this._topic.toString(),
      title: this._title,
      tags: this._tags,
      text: this._text,
      date: this._date.toISOString(),
      hash: this._hash
    };
  }
}
