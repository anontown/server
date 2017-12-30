import {
  AtPrerequisiteError,
  AtRightError,
  paramsErrorMaker,
} from "../../at-error";
import { IAuthToken } from "../../auth";
import { Config } from "../../config";
import { IGenerator } from "../../generator";
import { History } from "../history";
import { Profile } from "../profile";
import { Topic, TopicFork, TopicNormal, TopicOne } from "../topic";
import { User } from "../user";

export interface IVote {
  readonly user: string;
  readonly value: number;
}

export type ResType = "normal" | "history" | "topic" | "fork";

export type IResDB = IResNormalDB | IResHistoryDB | IResTopicDB | IResForkDB;

export function fromDBToRes(db: IResNormalDB, replyCount: number): ResNormal;
export function fromDBToRes(db: IResHistoryDB, replyCount: number): ResHistory;
export function fromDBToRes(db: IResTopicDB, replyCount: number): ResTopic;
export function fromDBToRes(db: IResForkDB, replyCount: number): ResFork;
export function fromDBToRes(db: IResDB, replyCount: number): Res;
export function fromDBToRes(db: IResDB, replyCount: number): Res {
  switch (db.type) {
    case "normal":
      return ResNormal.fromDB(db, replyCount);
    case "history":
      return ResHistory.fromDB(db, replyCount);
    case "topic":
      return ResTopic.fromDB(db, replyCount);
    case "fork":
      return ResFork.fromDB(db, replyCount);
  }
}

export interface IResBaseDB<T extends ResType, Body> {
  readonly id: string;
  readonly type: T;
  readonly body: {
    readonly topic: string,
    readonly date: string,
    readonly user: string,
    readonly vote: IVote[],
    readonly lv: number,
    readonly hash: string,
  } & Body;
}

export type IResNormalDB = IResBaseDB<"normal", {
  readonly name: string | null,
  readonly body: string,
  readonly reply: IReply | null,
  readonly deleteFlag: ResDeleteFlag,
  readonly profile: string | null,
  readonly age: boolean,
}>;

export type IResHistoryDB = IResBaseDB<"history", {
  history: string,
}>;

export type IResTopicDB = IResBaseDB<"topic", {}>;

export type IResForkDB = IResBaseDB<"fork", {
  fork: string;
}>;

export type ResAPIType = ResType | "delete";

export type IResAPI = IResNormalAPI | IResHistoryAPI | IResTopicAPI | IResForkAPI | IResDeleteAPI;

export interface IResBaseAPI<T extends ResAPIType> {
  readonly id: string;
  readonly topic: string;
  readonly date: Date;
  readonly user: string | null;
  readonly uv: number;
  readonly dv: number;
  readonly hash: string;
  readonly replyCount: number;
  readonly voteFlag: VoteFlag | null;
  readonly type: T;
}

export interface IResNormalAPI extends IResBaseAPI<"normal"> {
  readonly name: string | null;
  readonly body: string;
  readonly reply: string | null;
  readonly profile: string | null;
  readonly isReply: boolean | null;
}

export interface IResHistoryAPI extends IResBaseAPI<"history"> {
  readonly history: string;
}

export interface IResTopicAPI extends IResBaseAPI<"topic"> {
}

export interface IResForkAPI extends IResBaseAPI<"fork"> {
  readonly fork: string;
}

export interface IResDeleteAPI extends IResBaseAPI<"delete"> {
  readonly flag: "self" | "freeze";
}

export type VoteFlag = "uv" | "dv" | "not";
export type ResDeleteFlag = "active" | "self" | "freeze";
export interface IReply {
  readonly res: string;
  readonly user: string;
}

export abstract class ResBase<T extends ResType> {
  constructor(
    private _id: string,
    private _topic: string,
    private _date: Date,
    private _user: string,
    private _vote: IVote[],
    private _lv: number,
    private _hash: string,
    private _type: T,
    private _replyCount: number) {
  }

  get id() {
    return this._id;
  }

  get topic() {
    return this._topic;
  }

  get date() {
    return this._date;
  }

  get user() {
    return this._user;
  }

  get vote() {
    return this._vote;
  }

  get lv() {
    return this._lv;
  }

  get hash() {
    return this._hash;
  }

  get type() {
    return this._type;
  }

  get replyCount() {
    return this._replyCount;
  }

  v(resUser: User, user: User, type: "uv" | "dv", _authToken: IAuthToken) {
    if (user.id === this._user) {
      throw new AtRightError("自分に投票は出来ません");
    }
    if (this._vote.find(x => x.user === user.id) !== undefined) {
      throw new AtPrerequisiteError("既に投票しています");
    }
    const valueAbs = Math.floor(user.lv / 100) + 1;
    const value = type === "uv" ? valueAbs : -valueAbs;
    this._vote.push({ user: user.id, value });
    resUser.changeLv(resUser.lv + value);
  }

  cv(resUser: User, user: User, _authToken: IAuthToken) {
    const vote = this._vote.find(x => x.user === user.id);
    if (vote === undefined) {
      throw new AtPrerequisiteError("投票していません");
    }
    this._vote.splice(this._vote.indexOf(vote), 1);
    resUser.changeLv(resUser.lv - vote.value);
  }

  protected toBaseDB<Body extends object>(body: Body): IResBaseDB<T, Body> {
    return {
      id: this._id,
      type: this._type,
      body: Object.assign({}, body, {
        topic: this._topic,
        date: this._date.toISOString(),
        user: this._user,
        vote: this._vote,
        lv: this._lv,
        hash: this._hash,
      }),
    };
  }

  protected toBaseAPI(authToken: IAuthToken | null): IResBaseAPI<T> {
    let voteFlag: VoteFlag | null;
    if (authToken === null) {
      voteFlag = null;
    } else {
      const vote = this._vote.find(v => authToken.user === v.user);
      if (vote === undefined) {
        voteFlag = "not";
      } else {
        voteFlag = vote.value > 0 ? "uv" : "dv";
      }
    }

    return {
      id: this._id,
      topic: this._topic,
      date: this._date,
      user: (authToken !== null && authToken.user === this._user ? this._user : null),
      uv: this._vote.filter(x => x.value > 0).length,
      dv: this._vote.filter(x => x.value < 0).length,
      hash: this._hash,
      replyCount: this._replyCount,
      voteFlag,
      type: this._type,
    };
  }
}

export type Res = ResNormal | ResHistory | ResTopic | ResFork;

export class ResNormal extends ResBase<"normal"> {
  static fromDB(r: IResNormalDB, replyCount: number): ResNormal {
    return new ResNormal(r.body.name,
      r.body.body,
      r.body.reply,
      r.body.deleteFlag,
      r.body.profile,
      r.body.age,
      r.id,
      r.body.topic,
      new Date(r.body.date),
      r.body.user,
      r.body.vote,
      r.body.lv,
      r.body.hash,
      replyCount);
  }

  static create(
    objidGenerator: IGenerator<string>,
    topic: Topic,
    user: User,
    _authToken: IAuthToken,
    name: string | null,
    body: string,
    reply: Res | null,
    profile: Profile | null,
    age: boolean,
    now: Date): ResNormal {
    const bodyCheck = {
      field: "body",
      val: body,
      regex: Config.res.body.regex,
      message: Config.res.body.msg,
    };

    paramsErrorMaker(name !== null ?
      [
        bodyCheck,
        {
          field: "name",
          val: name,
          regex: Config.res.name.regex,
          message: Config.res.name.msg,
        },
      ] :
      [
        bodyCheck,
      ]);

    if (profile !== null) {
      // 自分のプロフィールか？
      if (profile.user !== user.id) {
        throw new AtRightError("自分のプロフィールを指定して下さい。");
      }
    }

    // もしリプ先があるかつ、トピックがリプ先と違えばエラー
    if (reply !== null && reply.topic !== topic.id) {
      throw new AtPrerequisiteError("他のトピックのレスへのリプは出来ません");
    }

    user.changeLastRes(now);

    const result = new ResNormal(name,
      body,
      reply !== null ? { res: reply.id, user: reply.user } : null,
      "active",
      profile !== null ? profile.id : null,
      age,
      objidGenerator.get(),
      topic.id,
      now,
      user.id,
      [],
      user.lv * 5,
      topic.hash(now, user),
      0);

    topic.resUpdate(result);
    return result;
  }

  private constructor(
    private _name: string | null,
    private _body: string,
    private _reply: IReply | null,
    private _deleteFlag: ResDeleteFlag,
    private _profile: string | null,
    private _age: boolean,
    id: string,
    topic: string,
    date: Date,
    user: string,
    vote: IVote[],
    lv: number,
    hash: string,
    replyCount: number) {
    super(id,
      topic,
      date,
      user,
      vote,
      lv,
      hash,
      "normal",
      replyCount);
  }

  get name() {
    return this._name;
  }

  get body() {
    return this._body;
  }

  get reply() {
    return this._reply;
  }

  get deleteFlag() {
    return this._deleteFlag;
  }

  get profile() {
    return this._profile;
  }

  get age() {
    return this._age;
  }

  toDB(): IResNormalDB {
    return super.toBaseDB({
      name: this._name,
      body: this._body,
      reply: this._reply,
      deleteFlag: this._deleteFlag,
      profile: this._profile,
      age: this._age,
    });
  }

  toAPI(authToken: IAuthToken | null): IResNormalAPI | IResDeleteAPI {
    if (this.deleteFlag === "active") {
      return {
        ...super.toBaseAPI(authToken),
        name: this._name,
        body: this._body,
        reply: this._reply !== null ? this._reply.res : null,
        profile: this._profile !== null ? this._profile : null,
        isReply: authToken === null || this._reply === null ? null : authToken.user === this._reply.user,
      };
    } else {
      return {
        ...super.toBaseAPI(authToken),
        type: "delete",
        flag: this.deleteFlag,
      };
    }
  }

  del(resUser: User, authToken: IAuthToken) {
    if (authToken.user !== this.user) {
      throw new AtRightError("人の書き込み削除は出来ません");
    }

    if (this._deleteFlag !== "active") {
      throw new AtPrerequisiteError("既に削除済みです");
    }

    this._deleteFlag = "self";
    resUser.changeLv(resUser.lv - 1);
  }
}

export class ResHistory extends ResBase<"history"> {
  static fromDB(r: IResHistoryDB, replyCount: number): ResHistory {
    return new ResHistory(r.body.history,
      r.id,
      r.body.topic,
      new Date(r.body.date),
      r.body.user,
      r.body.vote,
      r.body.lv,
      r.body.hash,
      replyCount);
  }

  static create(
    objidGenerator: IGenerator<string>,
    topic: TopicNormal,
    user: User,
    _authToken: IAuthToken,
    history: History,
    now: Date): ResHistory {
    const result = new ResHistory(history.id,
      objidGenerator.get(),
      topic.id,
      now,
      user.id,
      [],
      user.lv * 5,
      topic.hash(now, user),
      0);

    topic.resUpdate(result);
    return result;
  }

  private constructor(
    private _history: string,
    id: string,
    topic: string,
    date: Date,
    user: string,
    vote: IVote[],
    lv: number,
    hash: string,
    replyCount: number) {
    super(id,
      topic,
      date,
      user,
      vote,
      lv,
      hash,
      "history",
      replyCount);
  }

  get history() {
    return this._history;
  }

  toDB(): IResHistoryDB {
    return super.toBaseDB({ history: this._history });
  }

  toAPI(authToken: IAuthToken | null): IResHistoryAPI {
    return {
      ...super.toBaseAPI(authToken),
      history: this._history,
    };
  }
}

export class ResTopic extends ResBase<"topic"> {
  static fromDB(r: IResTopicDB, replyCount: number): ResTopic {
    return new ResTopic(r.id,
      r.body.topic,
      new Date(r.body.date),
      r.body.user,
      r.body.vote,
      r.body.lv,
      r.body.hash,
      replyCount);
  }

  static create(
    objidGenerator: IGenerator<string>,
    topic: TopicOne | TopicFork,
    user: User,
    _authToken: IAuthToken,
    now: Date): ResTopic {
    const result = new ResTopic(objidGenerator.get(),
      topic.id,
      now,
      user.id,
      [],
      user.lv * 5,
      topic.hash(now, user),
      0);

    topic.resUpdate(result);
    return result;
  }

  private constructor(
    id: string,
    topic: string,
    date: Date,
    user: string,
    vote: IVote[],
    lv: number,
    hash: string,
    replyCount: number) {
    super(id,
      topic,
      date,
      user,
      vote,
      lv,
      hash,
      "topic",
      replyCount);
  }

  toDB(): IResTopicDB {
    return super.toBaseDB({});
  }

  toAPI(authToken: IAuthToken | null): IResTopicAPI {
    return super.toBaseAPI(authToken);
  }
}

export class ResFork extends ResBase<"fork"> {
  static fromDB(r: IResForkDB, replyCount: number): ResFork {
    return new ResFork(r.body.fork,
      r.id,
      r.body.topic,
      new Date(r.body.date),
      r.body.user,
      r.body.vote,
      r.body.lv,
      r.body.hash,
      replyCount);
  }

  static create(
    objidGenerator: IGenerator<string>,
    topic: TopicNormal,
    user: User,
    _authToken: IAuthToken,
    fork: TopicFork,
    now: Date): ResFork {
    const result = new ResFork(fork.id,
      objidGenerator.get(),
      topic.id,
      now,
      user.id,
      [],
      user.lv * 5,
      topic.hash(now, user),
      0);

    topic.resUpdate(result);
    return result;
  }

  private constructor(
    private _fork: string,
    id: string,
    topic: string,
    date: Date,
    user: string,
    vote: IVote[],
    lv: number,
    hash: string,
    replyCount: number) {
    super(id,
      topic,
      date,
      user,
      vote,
      lv,
      hash,
      "fork",
      replyCount);
  }

  get fork() {
    return this._fork;
  }

  toDB(): IResForkDB {
    return super.toBaseDB({ fork: this._fork });
  }

  toAPI(authToken: IAuthToken | null): IResForkAPI {
    return {
      ...super.toBaseAPI(authToken),
      fork: this._fork,
    };
  }
}
