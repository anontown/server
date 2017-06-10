import { ObjectID } from 'mongodb';
import { User } from '../user';
import { Res, ResHistory, ResTopic, ResFork } from '../res';
import { History } from '../history';
import { IAuthToken } from '../../auth';
import { AtPrerequisiteError, paramsErrorMaker, paramsErrorMakerData } from '../../at-error'
import { Config } from '../../config';
import { StringUtil } from '../../util';
import { IGenerator } from '../../generator';

export type ITopicDB = ITopicNormalDB | ITopicOneDB | ITopicForkDB;

export interface ITopicBaseDB<T extends TopicType> {
  _id: ObjectID,
  title: string,
  update: Date,
  date: Date,
  type: T,
  ageUpdate: Date,
  active: boolean,
}

export interface ITopicSearchBaseDB<T extends TopicSearchType> extends ITopicBaseDB<T> {
  tags: string[],
  text: string,
}

export interface ITopicNormalDB extends ITopicSearchBaseDB<'normal'> {
}

export interface ITopicOneDB extends ITopicSearchBaseDB<'one'> {
}

export interface ITopicForkDB extends ITopicBaseDB<'fork'> {
  parent: ObjectID;
}

export type ITopicAPI = ITopicOneAPI | ITopicNormalAPI | ITopicForkAPI;

export interface ITopicBaseAPI<T extends TopicType> {
  id: string,
  title: string,
  update: string,
  date: string,
  resCount: number,
  type: T,
  active: boolean
}

export interface ITopicSearchBaseAPI<T extends TopicSearchType> extends ITopicBaseAPI<T> {
  tags: string[],
  text: string,
}

export interface ITopicNormalAPI extends ITopicSearchBaseAPI<'normal'> {
}

export interface ITopicOneAPI extends ITopicSearchBaseAPI<'one'> {
}

export interface ITopicForkAPI extends ITopicBaseAPI<'fork'> {
  parent: string
}

export type TopicSearchType = "one" | "normal";
export type TopicType = TopicSearchType | "fork";


export type Topic = TopicNormal | TopicOne | TopicFork;

export abstract class TopicBase<T extends TopicType> {
  constructor(private _id: ObjectID,
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

  toDB(): ITopicBaseDB<T> {
    return {
      _id: this._id,
      title: this._title,
      update: this._update,
      date: this._date,
      type: this._type,
      ageUpdate: this._ageUpdate,
      active: this._active
    };
  }

  toAPI(): ITopicBaseAPI<T> {
    return {
      id: this._id.toString(),
      title: this._title,
      update: this._update.toISOString(),
      date: this._date.toISOString(),
      resCount: this._resCount,
      type: this._type,
      active: this._active
    };
  }

  resUpdate(res: Res) {
    if (!this.active) {
      throw new AtPrerequisiteError("トピックが落ちているので書き込めません")
    }

    this._update = res.date;
    if (res.type === "normal" && res.age) {
      this._ageUpdate = res.date;
    }
  }

  static checkData({ title, tags, text }: { title?: string, tags?: string[], text?: string }) {
    let data: paramsErrorMakerData[] = [];
    if (title !== undefined) {
      data.push({
        field: "title",
        val: title,
        regex: Config.topic.title.regex,
        message: Config.topic.title.msg
      });
    }
    if (tags !== undefined) {
      data.push(() => {
        if (tags.length !== new Set(tags).size) {
          return {
            field: "tags",
            message: "タグの重複があります"
          }
        } else {
          return null;
        }
      });

      data.push(() => {
        if (tags.length > Config.topic.tags.max) {
          return {
            field: "tags",
            message: Config.topic.tags.msg
          };
        } else {
          return null;
        }
      });

      data.push(...tags.map((x, i) => ({
        field: `tags[${i}]`,
        val: x,
        regex: Config.topic.tags.regex,
        message: Config.topic.tags.msg
      })));
    }
    if (text !== undefined) {
      data.push({
        field: "text",
        val: text,
        regex: Config.topic.text.regex,
        message: Config.topic.text.msg
      });
    }

    paramsErrorMaker(data);
  }

  hash(date: Date, user: User): string {
    return StringUtil.hash(
      //ユーザー依存
      user.id + " " +

      //書き込み年月日依存
      date.getFullYear() + " " + date.getMonth() + " " + date.getDate() + " " +

      //トピ依存
      this._id.toString() +

      //ソルト依存
      Config.salt.hash);
  }
}

export abstract class TopicSearchBase<T extends TopicSearchType> extends TopicBase<T> {
  constructor(id: ObjectID,
    title: string,
    protected _tags: string[],
    protected _text: string,
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

  get text() {
    return this._text;
  }

  toDB(): ITopicSearchBaseDB<T> {
    return {
      ...super.toDB(),
      tags: this._tags,
      text: this._text,
    };
  }

  toAPI(): ITopicSearchBaseAPI<T> {
    return {
      ...super.toAPI(),
      tags: this._tags,
      text: this._text,
    };
  }
}

export class TopicNormal extends TopicSearchBase<'normal'> {
  constructor(id: ObjectID,
    title: string,
    tags: string[],
    text: string,
    update: Date,
    date: Date,
    resCount: number,
    ageUpdate: Date,
    active: boolean) {
    super(id,
      title,
      tags,
      text,
      update,
      date,
      resCount,
      'normal',
      ageUpdate,
      active);
  }

  static fromDB(db: ITopicNormalDB, resCount: number): TopicNormal {
    return new TopicNormal(db._id,
      db.title,
      db.tags,
      db.text,
      db.update,
      db.date,
      resCount,
      db.ageUpdate,
      db.active);
  }

  changeData(objidGenerator: IGenerator<ObjectID>, user: User, authToken: IAuthToken, title: string, tags: string[], text: string, now: Date): { res: ResHistory, history: History } {
    user.usePoint(10);
    TopicBase.checkData({ title, tags, text });

    this._title = title;
    this._tags = tags;
    this._text = text;

    let history = History.create(objidGenerator, this, now, this.hash(now, user), user);
    let res = ResHistory.create(objidGenerator,
      this,
      user,
      authToken,
      history,
      now);

    return { res, history };
  }

  static create(objidGenerator: IGenerator<ObjectID>, title: string, tags: string[], text: string, user: User, authToken: IAuthToken, now: Date): { topic: TopicNormal, res: Res, history: History } {
    this.checkData({ title, tags, text });
    let topic = new TopicNormal(objidGenerator.get(),
      title,
      tags,
      text,
      now,
      now,
      1,
      now,
      true);
    let cd = topic.changeData(objidGenerator, user, authToken, title, tags, text, now);
    user.changeLastTopic(now);

    return { topic, history: cd.history, res: cd.res };
  }
}

export class TopicOne extends TopicSearchBase<'one'> {
  constructor(id: ObjectID,
    title: string,
    tags: string[],
    text: string,
    update: Date,
    date: Date,
    resCount: number,
    ageUpdate: Date,
    active: boolean) {
    super(id,
      title,
      tags,
      text,
      update,
      date,
      resCount,
      'one',
      ageUpdate,
      active);
  }

  static fromDB(db: ITopicOneDB, resCount: number): TopicOne {
    return new TopicOne(db._id,
      db.title,
      db.tags,
      db.text,
      db.update,
      db.date,
      resCount,
      db.ageUpdate,
      db.active);
  }

  static create(objidGenerator: IGenerator<ObjectID>, title: string, tags: string[], text: string, user: User, authToken: IAuthToken, now: Date): { topic: TopicOne, res: Res } {
    this.checkData({ title, tags, text });
    let topic = new TopicOne(objidGenerator.get(),
      title,
      tags,
      text,
      now,
      now,
      1,
      now,
      true);

    let res = ResTopic.create(objidGenerator,
      topic,
      user,
      authToken,
      now);
    user.changeLastOneTopic(now);

    return { topic, res };
  }
}

export class TopicFork extends TopicBase<'fork'> {
  constructor(id: ObjectID,
    title: string,
    update: Date,
    date: Date,
    resCount: number,
    ageUpdate: Date,
    active: boolean,
    private _parent: ObjectID) {
    super(id,
      title,
      update,
      date,
      resCount,
      'fork',
      ageUpdate,
      active);
  }

  get parent() {
    return this._parent;
  }

  toDB(): ITopicForkDB {
    return {
      ...super.toDB(),
      parent: this._parent
    };
  }

  toAPI(): ITopicForkAPI {
    return {
      ...super.toAPI(),
      parent: this._parent.toString()
    };
  }

  static fromDB(db: ITopicForkDB, resCount: number): TopicFork {
    return new TopicFork(db._id,
      db.title,
      db.update,
      db.date,
      resCount,
      db.ageUpdate,
      db.active,
      db.parent);
  }

  static create(objidGenerator: IGenerator<ObjectID>, title: string, parent: TopicNormal, user: User, authToken: IAuthToken, now: Date): { topic: TopicFork, res: Res, resParent: Res } {
    this.checkData({ title });
    let topic = new TopicFork(objidGenerator.get(),
      title,
      now,
      now,
      1,
      now,
      true,
      parent.id);

    let res = ResTopic.create(objidGenerator,
      topic,
      user,
      authToken,
      now);

    let resParent = ResFork.create(objidGenerator,
      parent,
      user,
      authToken,
      topic,
      now);
    user.changeLastOneTopic(now);

    return { topic, res, resParent };
  }
}