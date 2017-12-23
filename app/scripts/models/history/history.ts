import { User } from '../user';
import { TopicNormal } from '../topic';
import { IGenerator } from '../../generator';

export interface IHistoryDB {
  id: string,
  body: {
    topic: string,
    title: string,
    tags: string[],
    body: string,
    date: string,
    hash: string,
    user: string
  }
}

export interface IHistoryAPI {
  id: string,
  topic: string,
  title: string,
  tags: string[],
  body: string,
  date: string,
  hash: string
}

export class History {
  static fromDB(h: IHistoryDB): History {
    return new History(h.id, h.body.topic, h.body.title, h.body.tags, h.body.body, new Date(h.body.date), h.body.hash, h.body.user);
  }

  static create(objidGenerator: IGenerator<string>, topic: TopicNormal, date: Date, hash: string, user: User): History {
    return new History(objidGenerator.get(), topic.id, topic.title, topic.tags, topic.body, date, hash, user.id);
  }

  private constructor(private _id: string,
    private _topic: string,
    private _title: string,
    private _tags: string[],
    private _body: string,
    private _date: Date,
    private _hash: string,
    private _user: string) {

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

  get body() {
    return this._body;
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
      id: this._id,
      body: {
        topic: this._topic,
        title: this._title,
        tags: this._tags,
        body: this._body,
        date: this._date.toISOString(),
        hash: this._hash,
        user: this._user
      }
    }
  }

  toAPI(): IHistoryAPI {
    return {
      id: this._id,
      topic: this._topic,
      title: this._title,
      tags: this._tags,
      body: this._body,
      date: this._date.toISOString(),
      hash: this._hash
    };
  }
}
