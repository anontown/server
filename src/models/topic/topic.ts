import * as Im from "immutable";
import Copyable, { PartialMap } from "ts-copyable";
import { AtPrerequisiteError, paramsErrorMaker, paramsErrorMakerData } from "../../at-error";
import { IAuthToken } from "../../auth";
import { Config } from "../../config";
import { IGenerator } from "../../generator";
import { hash } from "../../utils";
import { applyMixins } from "../../utils";
import { History } from "../history";
import { Res, ResFork, ResHistory, ResTopic } from "../res";
import { User } from "../user";
import * as moment from "moment-timezone";

export interface ITopicDB {
  id: string;
  body: ITopicNormalDB["body"] | ITopicOneDB["body"] | ITopicForkDB["body"];
}

export interface ITopicBaseDB<T extends TopicType, Body> {
  readonly id: string;
  readonly body: {
    readonly type: T;
    readonly title: string,
    readonly update: string,
    readonly date: string,
    readonly ageUpdate: string,
    readonly active: boolean,
  } & Body;
}

export type ITopicSearchBaseDB<T extends TopicSearchType> = ITopicBaseDB<T, {
  readonly tags: string[],
  readonly text: string,
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
  readonly text: string;
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

export abstract class TopicBase<T extends TopicType, C extends TopicBase<T, C>> {
  static checkData({ title, tags, text }: { title?: string, tags?: string[], text?: string }) {
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
    if (text !== undefined) {
      data.push({
        field: "text",
        val: text,
        regex: Config.topic.text.regex,
        message: Config.topic.text.msg,
      });
    }

    paramsErrorMaker(data);
  }

  abstract readonly id: string;
  abstract readonly title: string;
  abstract readonly update: Date;
  abstract readonly date: Date;
  abstract readonly resCount: number;
  abstract readonly type: T;
  abstract readonly ageUpdate: Date;
  abstract readonly active: boolean;

  abstract copy(partial: Partial<TopicBase<T, C>>): C;
  abstract mapCopy(partial: PartialMap<TopicBase<T, C>>): C;

  toBaseDB<Body extends object>(body: Body): ITopicBaseDB<T, Body> {
    return {
      id: this.id,
      body: Object.assign({}, body, {
        type: this.type,
        title: this.title,
        update: this.update.toISOString(),
        date: this.date.toISOString(),
        ageUpdate: this.ageUpdate.toISOString(),
        active: this.active,
      }),
    };
  }

  toBaseAPI(): ITopicBaseAPI<T> {
    return {
      id: this.id,
      title: this.title,
      update: this.update.toISOString(),
      date: this.date.toISOString(),
      resCount: this.resCount,
      type: this.type,
      active: this.active,
    };
  }

  resUpdate(res: Res): C {
    if (!this.active) {
      throw new AtPrerequisiteError("トピックが落ちているので書き込めません");
    }

    return this.copy({
      update: res.date,
      ageUpdate: res.type === "normal" && res.age ? res.date : this.ageUpdate,
    });
  }

  hash(date: Date, user: User): string {
    const mdate = moment(date).tz(Config.timezone);
    return hash(
      // ユーザー依存
      user.id + " " +

      // 書き込み年月日依存
      mdate.year() + " " + mdate.month() + " " + mdate.date() + " " +

      // トピ依存
      this.id +

      // ソルト依存
      Config.salt.hash);
  }
}

export abstract class TopicSearchBase<T extends TopicSearchType, C extends TopicSearchBase<T, C>>
  extends TopicBase<T, C> {
  abstract readonly tags: Im.List<string>;
  abstract readonly text: string;

  toDB(): ITopicSearchBaseDB<T> {
    return this.toBaseDB({
      tags: this.tags.toArray(),
      text: this.text,
    });
  }

  toAPI(): ITopicSearchBaseAPI<T> {
    return {
      ...this.toBaseAPI(),
      tags: this.tags.toArray(),
      text: this.text,
    };
  }
}
applyMixins(TopicSearchBase, [TopicBase]);

export class TopicNormal extends Copyable<TopicNormal> implements TopicSearchBase<"normal", TopicNormal> {
  static create(
    objidGenerator: IGenerator<string>,
    title: string,
    tags: string[],
    text: string,
    user: User,
    authToken: IAuthToken,
    now: Date) {
    TopicBase.checkData({ title, tags, text });
    const topic = new TopicNormal(objidGenerator(),
      title,
      Im.List(tags),
      text,
      now,
      now,
      1,
      now,
      true);
    const cd = topic.changeData(objidGenerator, user, authToken, title, tags, text, now);
    const newUser = cd.user.changeLastTopic(now);

    return { topic: cd.topic, history: cd.history, res: cd.res, user: newUser };
  }

  static fromDB(db: ITopicNormalDB, resCount: number): TopicNormal {
    return new TopicNormal(db.id,
      db.body.title,
      Im.List(db.body.tags),
      db.body.text,
      new Date(db.body.update),
      new Date(db.body.date),
      resCount,
      new Date(db.body.ageUpdate),
      db.body.active);
  }

  readonly type: "normal" = "normal";

  toBaseAPI!: () => ITopicBaseAPI<"normal">;
  hash!: (date: Date, user: User) => string;
  toAPI!: () => ITopicSearchBaseAPI<"normal">;
  resUpdate!: (res: Res) => TopicNormal;
  toDB!: () => ITopicSearchBaseDB<"normal">;
  toBaseDB!: <Body extends object>(body: Body) => ITopicBaseDB<"normal", Body>;

  constructor(
    readonly id: string,
    readonly title: string,
    readonly tags: Im.List<string>,
    readonly text: string,
    readonly update: Date,
    readonly date: Date,
    readonly resCount: number,
    readonly ageUpdate: Date,
    readonly active: boolean) {
    super(TopicNormal);
  }

  changeData(
    objidGenerator: IGenerator<string>,
    user: User,
    authToken: IAuthToken,
    title: string,
    tags: string[],
    text: string,
    now: Date) {
    const newUser = user.usePoint(10);
    TopicBase.checkData({ title, tags, text });

    const newTopic = this.copy({ title, tags: Im.List(tags), text });

    const history = History.create(objidGenerator, newTopic, now, newTopic.hash(now, newUser), newUser);
    const { res, topic: newNewTopic } = ResHistory.create(objidGenerator,
      newTopic,
      newUser,
      authToken,
      history,
      now);

    return { topic: newNewTopic, res, history, user: newUser };
  }
}
applyMixins(TopicNormal, [TopicSearchBase]);

export class TopicOne extends Copyable<TopicOne> implements TopicSearchBase<"one", TopicOne> {
  static fromDB(db: ITopicOneDB, resCount: number): TopicOne {
    return new TopicOne(db.id,
      db.body.title,
      Im.List(db.body.tags),
      db.body.text,
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
    text: string,
    user: User,
    authToken: IAuthToken,
    now: Date) {
    TopicBase.checkData({ title, tags, text });
    const topic = new TopicOne(objidGenerator(),
      title,
      Im.List(tags),
      text,
      now,
      now,
      1,
      now,
      true);

    const { res, topic: newTopic } = ResTopic.create(objidGenerator,
      topic,
      user,
      authToken,
      now);
    const newUser = user.changeLastOneTopic(now);

    return { topic: newTopic, res, user: newUser };
  }

  readonly type: "one" = "one";
  toBaseAPI!: () => ITopicBaseAPI<"one">;
  hash!: (date: Date, user: User) => string;
  toAPI!: () => ITopicSearchBaseAPI<"one">;
  resUpdate!: (res: Res) => TopicOne;
  toDB!: () => ITopicSearchBaseDB<"one">;
  toBaseDB!: <Body extends object>(body: Body) => ITopicBaseDB<"one", Body>;

  constructor(
    readonly id: string,
    readonly title: string,
    readonly tags: Im.List<string>,
    readonly text: string,
    readonly update: Date,
    readonly date: Date,
    readonly resCount: number,
    readonly ageUpdate: Date,
    readonly active: boolean) {
    super(TopicOne);
  }
}
applyMixins(TopicOne, [TopicSearchBase]);

export class TopicFork extends Copyable<TopicFork> implements TopicBase<"fork", TopicFork> {
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
    now: Date) {
    TopicBase.checkData({ title });
    const topic = new TopicFork(objidGenerator(),
      title,
      now,
      now,
      1,
      now,
      true,
      parent.id);

    const { res, topic: newTopic } = ResTopic.create(objidGenerator,
      topic,
      user,
      authToken,
      now);

    const { topic: newParent, res: resParent } = ResFork.create(objidGenerator,
      parent,
      user,
      authToken,
      newTopic,
      now);
    const newUser = user.changeLastOneTopic(now);

    return { topic: newTopic, res, resParent, user: newUser, parent: newParent };
  }

  readonly type: "fork" = "fork";
  toBaseAPI!: () => ITopicBaseAPI<"fork">;
  hash!: (date: Date, user: User) => string;
  resUpdate!: (res: Res) => TopicFork;
  toBaseDB!: <Body extends object>(body: Body) => ITopicBaseDB<"fork", Body>;

  constructor(
    readonly id: string,
    readonly title: string,
    readonly update: Date,
    readonly date: Date,
    readonly resCount: number,
    readonly ageUpdate: Date,
    readonly active: boolean,
    readonly parent: string) {
    super(TopicFork);
  }

  toDB(): ITopicForkDB {
    return this.toBaseDB({ parent: this.parent });
  }

  toAPI(): ITopicForkAPI {
    return {
      ...this.toBaseAPI(),
      parent: this.parent,
    };
  }
}
applyMixins(TopicFork, [TopicBase]);
