import * as Im from "immutable";
import Copyable from "ts-copyable";
import { IAuthToken } from "../../auth";
import { IGenerator } from "../../generator";
import { TopicNormal } from "../topic";
import { User } from "../user";

export interface IHistoryDB {
  readonly id: string;
  readonly body: {
    readonly topic: string,
    readonly title: string,
    readonly tags: string[],
    readonly text: string,
    readonly date: string,
    readonly hash: string,
    readonly user: string,
  };
}

export interface IHistoryAPI {
  readonly id: string;
  readonly topicID: string;
  readonly title: string;
  readonly tags: string[];
  readonly text: string;
  readonly date: string;
  readonly hash: string;
  readonly self: boolean | null;
}

export class History extends Copyable<History> {
  static fromDB(h: IHistoryDB): History {
    return new History(h.id,
      h.body.topic,
      h.body.title,
      Im.List(h.body.tags),
      h.body.text,
      new Date(h.body.date),
      h.body.hash,
      h.body.user);
  }

  static create(
    objidGenerator: IGenerator<string>,
    topic: TopicNormal,
    date: Date,
    hash: string,
    user: User): History {
    return new History(
      objidGenerator(),
      topic.id,
      topic.title,
      Im.List(topic.tags),
      topic.text,
      date, hash,
      user.id);
  }

  constructor(
    readonly id: string,
    readonly topic: string,
    readonly title: string,
    readonly tags: Im.List<string>,
    readonly text: string,
    readonly date: Date,
    readonly hash: string,
    readonly user: string) {
    super(History);
  }

  toDB(): IHistoryDB {
    return {
      id: this.id,
      body: {
        topic: this.topic,
        title: this.title,
        tags: this.tags.toArray(),
        text: this.text,
        date: this.date.toISOString(),
        hash: this.hash,
        user: this.user,
      },
    };
  }

  toAPI(authToken: IAuthToken | null): IHistoryAPI {
    return {
      id: this.id,
      topicID: this.topic,
      title: this.title,
      tags: this.tags.toArray(),
      text: this.text,
      date: this.date.toISOString(),
      hash: this.hash,
      self: authToken !== null ? authToken.user === this.user : null,
    };
  }
}
