import { AtPrerequisiteError, paramsErrorMaker, paramsErrorMakerData } from "../../at-error";
import { IAuthToken } from "../../auth";
import { Config } from "../../config";
import { IGenerator } from "../../generator";
import { hash } from "../../utils";
import { History } from "../history";
import { Res, ResFork, ResHistory, ResTopic } from "../res";
import { User } from "../user";

export type ITopicDB = ITopicNormalDB | ITopicOneDB | ITopicForkDB;

export interface ITopicBaseDB<T extends TopicType, Body> {
  readonly id: string;
  readonly type: T;
  readonly body: {
    readonly title: string,
    readonly update: string,
    readonly date: string,
    readonly ageUpdate: string,
    readonly active: boolean,
  } & Body;
}

export type ITopicSearchBaseDB<T extends TopicSearchType> = ITopicBaseDB<T, {
  readonly tags: string[],
  readonly body: string,
}>;

export type ITopicNormalDB = ITopicSearchBaseDB<"normal">;

export type ITopicOneDB = ITopicSearchBaseDB<"one">;

export type ITopicForkDB = ITopicBaseDB<"fork", {
  readonly parent: string;
}>;

export type ITopicAPI = ITopicOneAPI | ITopicNormalAPI | ITopicForkAPI;

export interface ITopicBaseAPI<T extends TopicType> {
  readonly id: string;
  readonly title: string;
  readonly update: string;
  readonly date: string;
  readonly resCount: number;
  readonly type: T;
  readonly active: boolean;
}

export interface ITopicSearchBaseAPI<T extends TopicSearchType> extends ITopicBaseAPI<T> {
  readonly tags: string[];
  readonly body: string;
}

export interface ITopicNormalAPI extends ITopicSearchBaseAPI<"normal"> {
}

export interface ITopicOneAPI extends ITopicSearchBaseAPI<"one"> {
}

export interface ITopicForkAPI extends ITopicBaseAPI<"fork"> {
  readonly parent: string;
}

export type TopicSearchType = "one" | "normal";
export type TopicType = TopicSearchType | "fork";

export type Topic = TopicNormal | TopicOne | TopicFork;

export abstract class TopicBase<T extends TopicType> {
  static checkData({ title, tags, body }: { title?: string, tags?: string[], body?: string }) {
    const data: paramsErrorMakerData[] = [];
    if (title !== undefined) {
      data.push({
        field: "title",
        val: title,
        regex: Config.topic.title.regex,
        message: Config.topic.title.msg,
      });
    }
    if (tags !== undefined) {
      data.push(() => {
        if (tags.length !== new Set(tags).size) {
          return {
            field: "tags",
            message: "タグの重複があります",
          };
        } else {
          return null;
        }
      });

      data.push(() => {
        if (tags.length > Config.topic.tags.max) {
          return {
            field: "tags",
            message: Config.topic.tags.msg,
          };
        } else {
          return null;
        }
      });

      data.push(...tags.map((x, i) => ({
        field: `tags[${i}]`,
        val: x,
        regex: Config.topic.tags.regex,
        message: Config.topic.tags.msg,
      })));
    }
    if (body !== undefined) {
      data.push({
        field: "body",
        val: body,
        regex: Config.topic.body.regex,
        message: Config.topic.body.msg,
      });
    }

    paramsErrorMaker(data);
  }

  constructor(
    private _id: string,
    protected _title: string,
    private _update: Date,
    private _date: Date,
    private _resCount: number,
    private _type: T,
    private _ageUpdate: Date,
    private _active: boolean) {
  }

  get id() {
    return this._id;
  }

  get title() {
    return this._title;
  }

  get update() {
    return this._update;
  }

  get date() {
    return this._date;
  }

  get resCount() {
    return this._resCount;
  }

  get type() {
    return this._type;
  }

  get ageUpdate() {
    return this._ageUpdate;
  }

  get active() {
    return this._active;
  }

  toBaseDB<Body extends object>(body: Body): ITopicBaseDB<T, Body> {
    return {
      id: this._id,
      type: this._type,
      body: Object.assign({}, body, {
        title: this._title,
        update: this._update.toISOString(),
        date: this._date.toISOString(),
        ageUpdate: this._ageUpdate.toISOString(),
        active: this._active,
      }),
    };
  }

  toAPI(): ITopicBaseAPI<T> {
    return {
      id: this._id,
      title: this._title,
      update: this._update.toISOString(),
      date: this._date.toISOString(),
      resCount: this._resCount,
      type: this._type,
      active: this._active,
    };
  }

  resUpdate(res: Res) {
    if (!this.active) {
      throw new AtPrerequisiteError("トピックが落ちているので書き込めません");
    }

    this._update = res.date;
    if (res.type === "normal" && res.age) {
      this._ageUpdate = res.date;
    }
  }

  hash(date: Date, user: User): string {
    return hash(
      // ユーザー依存
      user.id + " " +

      // 書き込み年月日依存
      date.getFullYear() + " " + date.getMonth() + " " + date.getDate() + " " +

      // トピ依存
      this._id +

      // ソルト依存
      Config.salt.hash);
  }
}

export abstract class TopicSearchBase<T extends TopicSearchType> extends TopicBase<T> {
  constructor(
    id: string,
    title: string,
    protected _tags: string[],
    protected _body: string,
    update: Date,
    date: Date,
    resCount: number,
    type: T,
    ageUpdate: Date,
    active: boolean) {
    super(id,
      title,
      update,
      date,
      resCount,
      type,
      ageUpdate,
      active);
  }

  get tags() {
    return this._tags;
  }

  get body() {
    return this._body;
  }

  toDB(): ITopicSearchBaseDB<T> {
    return super.toBaseDB({
      tags: this._tags,
      body: this._body,
    });
  }

  toAPI(): ITopicSearchBaseAPI<T> {
    return {
      ...super.toAPI(),
      tags: this._tags,
      body: this._body,
    };
  }
}

export class TopicNormal extends TopicSearchBase<"normal"> {
  static create(
    objidGenerator: IGenerator<string>,
    title: string,
    tags: string[],
    body: string,
    user: User,
    authToken: IAuthToken,
    now: Date): { topic: TopicNormal, res: Res, history: History } {
    this.checkData({ title, tags, body });
    const topic = new TopicNormal(objidGenerator.get(),
      title,
      tags,
      body,
      now,
      now,
      1,
      now,
      true);
    const cd = topic.changeData(objidGenerator, user, authToken, title, tags, body, now);
    user.changeLastTopic(now);

    return { topic, history: cd.history, res: cd.res };
  }

  static fromDB(db: ITopicNormalDB, resCount: number): TopicNormal {
    return new TopicNormal(db.id,
      db.body.title,
      db.body.tags,
      db.body.body,
      new Date(db.body.update),
      new Date(db.body.date),
      resCount,
      new Date(db.body.ageUpdate),
      db.body.active);
  }

  constructor(
    id: string,
    title: string,
    tags: string[],
    body: string,
    update: Date,
    date: Date,
    resCount: number,
    ageUpdate: Date,
    active: boolean) {
    super(id,
      title,
      tags,
      body,
      update,
      date,
      resCount,
      "normal",
      ageUpdate,
      active);
  }

  changeData(
    objidGenerator: IGenerator<string>,
    user: User,
    authToken: IAuthToken,
    title: string,
    tags: string[],
    body: string,
    now: Date): { res: ResHistory, history: History } {
    user.usePoint(10);
    TopicBase.checkData({ title, tags, body });

    this._title = title;
    this._tags = tags;
    this._body = body;

    const history = History.create(objidGenerator, this, now, this.hash(now, user), user);
    const res = ResHistory.create(objidGenerator,
      this,
      user,
      authToken,
      history,
      now);

    return { res, history };
  }
}

export class TopicOne extends TopicSearchBase<"one"> {
  static fromDB(db: ITopicOneDB, resCount: number): TopicOne {
    return new TopicOne(db.id,
      db.body.title,
      db.body.tags,
      db.body.body,
      new Date(db.body.update),
      new Date(db.body.date),
      resCount,
      new Date(db.body.ageUpdate),
      db.body.active);
  }

  static create(
    objidGenerator: IGenerator<string>,
    title: string,
    tags: string[],
    body: string,
    user: User,
    authToken: IAuthToken,
    now: Date): { topic: TopicOne, res: Res } {
    this.checkData({ title, tags, body });
    const topic = new TopicOne(objidGenerator.get(),
      title,
      tags,
      body,
      now,
      now,
      1,
      now,
      true);

    const res = ResTopic.create(objidGenerator,
      topic,
      user,
      authToken,
      now);
    user.changeLastOneTopic(now);

    return { topic, res };
  }

  constructor(
    id: string,
    title: string,
    tags: string[],
    body: string,
    update: Date,
    date: Date,
    resCount: number,
    ageUpdate: Date,
    active: boolean) {
    super(id,
      title,
      tags,
      body,
      update,
      date,
      resCount,
      "one",
      ageUpdate,
      active);
  }
}

export class TopicFork extends TopicBase<"fork"> {
  static fromDB(db: ITopicForkDB, resCount: number): TopicFork {
    return new TopicFork(db.id,
      db.body.title,
      new Date(db.body.update),
      new Date(db.body.date),
      resCount,
      new Date(db.body.ageUpdate),
      db.body.active,
      db.body.parent);
  }

  static create(
    objidGenerator: IGenerator<string>,
    title: string,
    parent: TopicNormal,
    user: User,
    authToken: IAuthToken,
    now: Date): { topic: TopicFork, res: Res, resParent: Res } {
    this.checkData({ title });
    const topic = new TopicFork(objidGenerator.get(),
      title,
      now,
      now,
      1,
      now,
      true,
      parent.id);

    const res = ResTopic.create(objidGenerator,
      topic,
      user,
      authToken,
      now);

    const resParent = ResFork.create(objidGenerator,
      parent,
      user,
      authToken,
      topic,
      now);
    user.changeLastOneTopic(now);

    return { topic, res, resParent };
  }

  constructor(
    id: string,
    title: string,
    update: Date,
    date: Date,
    resCount: number,
    ageUpdate: Date,
    active: boolean,
    private _parent: string) {
    super(id,
      title,
      update,
      date,
      resCount,
      "fork",
      ageUpdate,
      active);
  }

  get parent() {
    return this._parent;
  }

  toDB(): ITopicForkDB {
    return super.toBaseDB({ parent: this._parent });
  }

  toAPI(): ITopicForkAPI {
    return {
      ...super.toAPI(),
      parent: this._parent,
    };
  }
}
