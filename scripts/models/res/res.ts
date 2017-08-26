import { ObjectID } from 'mongodb';
import { User } from '../user';
import { Topic, TopicNormal, TopicOne, TopicFork } from '../topic';
import { Profile } from '../profile';
import { IAuthToken } from '../../auth';
import {
  AtRightError,
  paramsErrorMaker,
  AtPrerequisiteError
} from '../../at-error'
import { Config } from '../../config';
import { IGenerator } from '../../generator';
import { History } from "../history";

export interface IVote {
  user: ObjectID,
  value: number,
  lv: number
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

export interface IResBaseDB<T extends ResType> {
  _id: ObjectID,
  topic: ObjectID,
  date: Date,
  user: ObjectID,
  vote: IVote[],
  lv: number,
  hash: string,
  type: T
}

export interface IResNormalDB extends IResBaseDB<"normal"> {
  name: string | null,
  body: string,
  reply: IReply | null,
  deleteFlag: ResDeleteFlag,
  profile: ObjectID | null,
  age: boolean
}

export interface IResHistoryDB extends IResBaseDB<"history"> {
  history: ObjectID
}

export interface IResTopicDB extends IResBaseDB<"topic"> {
}

export interface IResForkDB extends IResBaseDB<"fork"> {
  fork: ObjectID;
}

export type ResAPIType = ResType | "delete";

export type IResAPI = IResNormalAPI | IResHistoryAPI | IResTopicAPI | IResForkAPI | IResDeleteAPI;

export interface IResBaseAPI<T extends ResAPIType> {
  id: string,
  topic: string,
  date: Date,
  user: string | null,
  uv: number,
  dv: number,
  hash: string,
  replyCount: number,
  voteFlag: VoteFlag | null,
  type: T
}

export interface IResNormalAPI extends IResBaseAPI<"normal"> {
  name: string | null,
  body: string,
  reply: string | null,
  profile: string | null,
  isReply: boolean | null
}

export interface IResHistoryAPI extends IResBaseAPI<"history"> {
  history: string;
}

export interface IResTopicAPI extends IResBaseAPI<"topic"> {
}

export interface IResForkAPI extends IResBaseAPI<"fork"> {
  fork: string;
}

export interface IResDeleteAPI extends IResBaseAPI<"delete"> {
  flag: "self" | "freeze";
}

export type VoteFlag = "uv" | "dv" | "not";
export type ResDeleteFlag = "active" | "self" | "freeze";
export interface IReply {
  res: ObjectID;
  user: ObjectID;
}

export abstract class ResBase<T extends ResType> {
  constructor(private _id: ObjectID,
    private _topic: ObjectID,
    private _date: Date,
    private _user: ObjectID,
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

  get voteValue() {
    if (this._vote.length === 0) {
      return 0;
    } else {
      return this._vote
        .map(x => x.value)
        .reduce((x, y) => x + y);
    }
  }

  protected toBaseDB(): IResBaseDB<T> {
    return {
      _id: this._id,
      topic: this._topic,
      date: this._date,
      user: this._user,
      vote: this._vote,
      lv: this._lv,
      hash: this._hash,
      type: this._type
    };
  }

  protected toBaseAPI(authToken: IAuthToken | null): IResBaseAPI<T> {
    let voteFlag: VoteFlag | null;
    if (authToken === null) {
      voteFlag = null;
    } else {
      let vote = this._vote.find((v) => authToken.user.equals(v.user));
      if (vote === undefined) {
        voteFlag = "not";
      } else {
        voteFlag = vote.value > 0 ? "uv" : "dv";
      }
    }

    return {
      id: this._id.toString(),
      topic: this._topic.toString(),
      date: this._date,
      user: (authToken !== null && authToken.user.equals(this._user) ? this._user.toString() : null),
      uv: this._vote.filter(x => x.value > 0).length,
      dv: this._vote.filter(x => x.value < 0).length,
      hash: this._hash,
      replyCount: this._replyCount,
      voteFlag,
      type: this._type
    };
  }

  uv(resUser: User, user: User, _authToken: IAuthToken) {
    if (user.id.equals(this._user)) {
      throw new AtRightError("自分に投票は出来ません");
    }
    if (this._vote.find(x => x.user.equals(user.id)) !== undefined) {
      throw new AtPrerequisiteError("既に投票しています");
    }
    let lv = Math.floor(user.lv / 100) + 1;
    this._vote.push({ user: user.id, value: user.lv, lv });
    resUser.changeLv(resUser.lv + lv);
  }

  dv(resUser: User, user: User, _authToken: IAuthToken) {
    if (user.id.equals(this._user)) {
      throw new AtRightError("自分に投票は出来ません");
    }
    if (this._vote.find(x => x.user.equals(user.id)) !== undefined) {
      throw new AtPrerequisiteError("既に投票しています");
    }

    let lv = -Math.floor(user.lv / 100) - 1;
    this._vote.push({ user: user.id, value: -Math.min(user.lv, Math.ceil(this._lv / 3)), lv });
    resUser.changeLv(resUser.lv + lv);
  }

  cv(resUser: User, user: User, _authToken: IAuthToken) {
    let vote = this._vote.find(x => x.user.equals(user.id));
    if (vote === undefined) {
      throw new AtPrerequisiteError("投票していません");
    }
    this._vote.splice(this._vote.indexOf(vote), 1);
    resUser.changeLv(resUser.lv - vote.value);
  }
}

export type Res = ResNormal | ResHistory | ResTopic | ResFork;

export class ResNormal extends ResBase<'normal'>{
  private constructor(private _name: string | null,
    private _body: string,
    private _reply: IReply | null,
    private _deleteFlag: ResDeleteFlag,
    private _profile: ObjectID | null,
    private _age: boolean,
    id: ObjectID,
    topic: ObjectID,
    date: Date,
    user: ObjectID,
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
      'normal',
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
    return {
      ...super.toBaseDB(),
      name: this._name,
      body: this._body,
      reply: this._reply,
      deleteFlag: this._deleteFlag,
      profile: this._profile,
      age: this._age
    };
  }

  toAPI(authToken: IAuthToken | null): IResNormalAPI | IResDeleteAPI {
    if (this.deleteFlag === "active") {
      return {
        ...super.toBaseAPI(authToken),
        name: this._name,
        body: this._body,
        reply: this._reply !== null ? this._reply.res.toString() : null,
        profile: this._profile !== null ? this._profile.toString() : null,
        isReply: authToken === null || this._reply === null ? null : authToken.user.equals(this._reply.user)
      };
    } else {
      return {
        ...super.toBaseAPI(authToken),
        type: "delete",
        flag: this.deleteFlag
      };
    }
  }

  static fromDB(r: IResNormalDB, replyCount: number): ResNormal {
    return new ResNormal(r.name,
      r.body,
      r.reply,
      r.deleteFlag,
      r.profile,
      r.age,
      r._id,
      r.topic,
      r.date,
      r.user,
      r.vote,
      r.lv,
      r.hash,
      replyCount);
  }

  static create(objidGenerator: IGenerator<ObjectID>, topic: Topic, user: User, _authToken: IAuthToken, name: string | null, body: string, reply: Res | null, profile: Profile | null, age: boolean, now: Date): ResNormal {
    let bodyCheck = {
      field: "body",
      val: body,
      regex: Config.res.body.regex,
      message: Config.res.body.msg
    };

    paramsErrorMaker(name !== null ?
      [
        bodyCheck,
        {
          field: "name",
          val: name,
          regex: Config.res.name.regex,
          message: Config.res.name.msg
        }
      ] :
      [
        bodyCheck
      ]);

    if (profile !== null) {
      //自分のプロフィールか？
      if (!profile.user.equals(user.id)) {
        throw new AtRightError("自分のプロフィールを指定して下さい。");
      }
    }

    //もしリプ先があるかつ、トピックがリプ先と違えばエラー
    if (reply !== null && !reply.topic.equals(topic.id)) {
      throw new AtPrerequisiteError("他のトピックのレスへのリプは出来ません");
    }

    user.changeLastRes(now);

    let result = new ResNormal(name,
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

  del(resUser: User, authToken: IAuthToken) {
    if (!authToken.user.equals(this.user)) {
      throw new AtRightError("人の書き込み削除は出来ません");
    }

    if (this._deleteFlag !== "active") {
      throw new AtPrerequisiteError("既に削除済みです");
    }

    this._deleteFlag = "self";
    resUser.changeLv(resUser.lv - 1);
  }
}

export class ResHistory extends ResBase<'history'>{
  private constructor(private _history: ObjectID,
    id: ObjectID,
    topic: ObjectID,
    date: Date,
    user: ObjectID,
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
      'history',
      replyCount);
  }

  get history() {
    return this._history;
  }

  toDB(): IResHistoryDB {
    return {
      ...super.toBaseDB(),
      history: this._history
    };
  }

  toAPI(authToken: IAuthToken | null): IResHistoryAPI {
    return {
      ...super.toBaseAPI(authToken),
      history: this._history.toString()
    };
  }

  static fromDB(r: IResHistoryDB, replyCount: number): ResHistory {
    return new ResHistory(r.history,
      r._id,
      r.topic,
      r.date,
      r.user,
      r.vote,
      r.lv,
      r.hash,
      replyCount);
  }

  static create(objidGenerator: IGenerator<ObjectID>, topic: TopicNormal, user: User, _authToken: IAuthToken, history: History, now: Date): ResHistory {
    let result = new ResHistory(history.id,
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
}

export class ResTopic extends ResBase<"topic">{
  private constructor(id: ObjectID,
    topic: ObjectID,
    date: Date,
    user: ObjectID,
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
      'topic',
      replyCount);
  }

  toDB(): IResTopicDB {
    return super.toBaseDB();
  }

  toAPI(authToken: IAuthToken | null): IResTopicAPI {
    return super.toBaseAPI(authToken);
  }

  static fromDB(r: IResTopicDB, replyCount: number): ResTopic {
    return new ResTopic(r._id,
      r.topic,
      r.date,
      r.user,
      r.vote,
      r.lv,
      r.hash,
      replyCount);
  }

  static create(objidGenerator: IGenerator<ObjectID>, topic: TopicOne | TopicFork, user: User, _authToken: IAuthToken, now: Date): ResTopic {
    let result = new ResTopic(objidGenerator.get(),
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
}

export class ResFork extends ResBase<'fork'>{
  private constructor(private _fork: ObjectID,
    id: ObjectID,
    topic: ObjectID,
    date: Date,
    user: ObjectID,
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
      'fork',
      replyCount);
  }

  get fork() {
    return this._fork;
  }

  toDB(): IResForkDB {
    return {
      ...super.toBaseDB(),
      fork: this._fork
    };
  }

  toAPI(authToken: IAuthToken | null): IResForkAPI {
    return {
      ...super.toBaseAPI(authToken),
      fork: this._fork.toString()
    };
  }

  static fromDB(r: IResForkDB, replyCount: number): ResFork {
    return new ResFork(r.fork,
      r._id,
      r.topic,
      r.date,
      r.user,
      r.vote,
      r.lv,
      r.hash,
      replyCount);
  }

  static create(objidGenerator: IGenerator<ObjectID>, topic: TopicNormal, user: User, _authToken: IAuthToken, fork: TopicFork, now: Date): ResFork {
    let result = new ResFork(fork.id,
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
}