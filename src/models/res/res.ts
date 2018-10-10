import * as Im from "immutable";
import {
  AtPrerequisiteError,
  AtRightError,
  paramsErrorMaker,
} from "../../at-error";
import { IAuthToken } from "../../auth";
import { Config } from "../../config";
import { IGenerator } from "../../generator";
import { Copyable } from "../../utils";
import { applyMixins } from "../../utils";
import { History } from "../history";
import { Profile } from "../profile";
import { Topic, TopicFork, TopicNormal, TopicOne } from "../topic";
import { User } from "../user";

export interface IVote {
  readonly user: string;
  readonly value: number;
}

export type ResType = "normal" | "history" | "topic" | "fork";

export interface IResDB {
  id: string;
  body: IResNormalDB["body"] | IResHistoryDB["body"] | IResTopicDB["body"] | IResForkDB["body"];
}

export function fromDBToRes(db: IResNormalDB, replyCount: number): ResNormal;
export function fromDBToRes(db: IResHistoryDB, replyCount: number): ResHistory;
export function fromDBToRes(db: IResTopicDB, replyCount: number): ResTopic;
export function fromDBToRes(db: IResForkDB, replyCount: number): ResFork;
export function fromDBToRes(db: IResDB, replyCount: number): Res;
export function fromDBToRes(db: IResDB, replyCount: number): Res {
  switch (db.body.type) {
    case "normal":
      return ResNormal.fromDB({ id: db.id, body: db.body }, replyCount);
    case "history":
      return ResHistory.fromDB({ id: db.id, body: db.body }, replyCount);
    case "topic":
      return ResTopic.fromDB({ id: db.id, body: db.body }, replyCount);
    case "fork":
      return ResFork.fromDB({ id: db.id, body: db.body }, replyCount);
  }
}

export interface IResBaseDB<T extends ResType, Body> {
  readonly id: string;
  readonly body: {
    readonly type: T;
    readonly topic: string,
    readonly date: string,
    readonly user: string,
    readonly votes: IVote[],
    readonly lv: number,
    readonly hash: string,
  } & Body;
}

export type IResNormalDB = IResBaseDB<"normal", {
  readonly name: string | null,
  readonly text: string,
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
  readonly topicID: string;
  readonly date: Date;
  readonly self: boolean | null;
  readonly uv: number;
  readonly dv: number;
  readonly hash: string;
  readonly replyCount: number;
  readonly voteFlag: VoteFlag | null;
  readonly type: T;
}

export interface IResNormalAPI extends IResBaseAPI<"normal"> {
  readonly name: string | null;
  readonly text: string;
  readonly replyID: string | null;
  readonly profileID: string | null;
  readonly isReply: boolean | null;
}

export interface IResHistoryAPI extends IResBaseAPI<"history"> {
  readonly historyID: string;
}

export interface IResTopicAPI extends IResBaseAPI<"topic"> {
}

export interface IResForkAPI extends IResBaseAPI<"fork"> {
  readonly forkID: string;
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

export abstract class ResBase<T extends ResType, C extends ResBase<T, C>> {
  abstract readonly id: string;
  abstract readonly topic: string;
  abstract readonly date: Date;
  abstract readonly user: string;
  abstract readonly votes: Im.List<IVote>;
  abstract readonly lv: number;
  abstract readonly hash: string;
  abstract readonly type: T;
  abstract readonly replyCount: number;

  abstract copy(partial: Partial<ResBase<T, C>>): C;

  v(resUser: User, user: User, type: "uv" | "dv", _authToken: IAuthToken): { res: C, resUser: User } {
    const voted = this.votes.find(x => x.user === user.id);
    const data = voted !== undefined && ((voted.value > 0 && type === "dv") || (voted.value < 0 && type === "uv"))
      ? this.cv(resUser, user, _authToken)
      : { res: this, resUser };
    return data.res._v(data.resUser, user, type, _authToken);
  }

  _v(resUser: User, user: User, type: "uv" | "dv", _authToken: IAuthToken): { res: C, resUser: User } {
    if (user.id === this.user) {
      throw new AtRightError("自分に投票は出来ません");
    }
    if (this.votes.find(x => x.user === user.id) !== undefined) {
      throw new AtPrerequisiteError("既に投票しています");
    }
    const valueAbs = Math.floor(user.lv / 100) + 1;
    const value = type === "uv" ? valueAbs : -valueAbs;
    const newResUser = resUser.changeLv(resUser.lv + value);
    return {
      res: this.copy({
        votes: this.votes.push({ user: user.id, value }),
      }),
      resUser: newResUser,
    };
  }

  cv(resUser: User, user: User, _authToken: IAuthToken): { res: C, resUser: User } {
    const vote = this.votes.find(x => x.user === user.id);
    if (vote === undefined) {
      throw new AtPrerequisiteError("投票していません");
    }
    const newResUser = resUser.changeLv(resUser.lv - vote.value);
    return {
      res: this.copy({
        votes: this.votes.remove(this.votes.indexOf(vote)),
      }),
      resUser: newResUser,
    };
  }

  toBaseDB<Body extends object>(body: Body): IResBaseDB<T, Body> {
    return {
      id: this.id,
      body: Object.assign({}, body, {
        type: this.type,
        topic: this.topic,
        date: this.date.toISOString(),
        user: this.user,
        votes: this.votes.toArray(),
        lv: this.lv,
        hash: this.hash,
      }),
    };
  }

  toBaseAPI(authToken: IAuthToken | null): IResBaseAPI<T> {
    let voteFlag: VoteFlag | null;
    if (authToken === null) {
      voteFlag = null;
    } else {
      const vote = this.votes.find(v => authToken.user === v.user);
      if (vote === undefined) {
        voteFlag = "not";
      } else {
        voteFlag = vote.value > 0 ? "uv" : "dv";
      }
    }

    return {
      id: this.id,
      topicID: this.topic,
      date: this.date,
      self: authToken !== null ? authToken.user === this.user : null,
      uv: this.votes.filter(x => x.value > 0).size,
      dv: this.votes.filter(x => x.value < 0).size,
      hash: this.hash,
      replyCount: this.replyCount,
      voteFlag,
      type: this.type,
    };
  }
}

export type Res = ResNormal | ResHistory | ResTopic | ResFork;

export class ResNormal extends Copyable<ResNormal> implements ResBase<"normal", ResNormal> {
  static fromDB(r: IResNormalDB, replyCount: number): ResNormal {
    return new ResNormal(r.body.name,
      r.body.text,
      r.body.reply,
      r.body.deleteFlag,
      r.body.profile,
      r.body.age,
      r.id,
      r.body.topic,
      new Date(r.body.date),
      r.body.user,
      Im.List(r.body.votes),
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
    text: string,
    reply: Res | null,
    profile: Profile | null,
    age: boolean,
    now: Date) {
    const bodyCheck = {
      field: "text",
      val: text,
      regex: Config.res.text.regex,
      message: Config.res.text.msg,
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

    if (profile !== null && profile.user !== user.id) {
      throw new AtRightError("自分のプロフィールを指定して下さい。");
    }

    // もしリプ先があるかつ、トピックがリプ先と違えばエラー
    if (reply !== null && reply.topic !== topic.id) {
      throw new AtPrerequisiteError("他のトピックのレスへのリプは出来ません");
    }

    const newUser = user.changeLastRes(now);

    const result = new ResNormal(name,
      text,
      reply !== null ? { res: reply.id, user: reply.user } : null,
      "active",
      profile !== null ? profile.id : null,
      age,
      objidGenerator(),
      topic.id,
      now,
      newUser.id,
      Im.List(),
      newUser.lv * 5,
      topic.hash(now, newUser),
      0);

    const newTopic = topic.resUpdate(result);
    return { res: result, user: newUser, topic: newTopic };
  }

  readonly type: "normal" = "normal";

  toBaseAPI!: (authToken: IAuthToken | null) => IResBaseAPI<"normal">;
  toBaseDB!: <Body extends object>(body: Body) => IResBaseDB<"normal", Body>;
  cv!: (resUser: User, user: User, _authToken: IAuthToken) => { res: ResNormal, resUser: User };
  _v!: (resUser: User, user: User, type: "uv" | "dv", _authToken: IAuthToken) => { res: ResNormal, resUser: User };
  v!: (resUser: User, user: User, type: "uv" | "dv", _authToken: IAuthToken) => { res: ResNormal, resUser: User };

  constructor(
    readonly name: string | null,
    readonly text: string,
    readonly reply: IReply | null,
    readonly deleteFlag: ResDeleteFlag,
    readonly profile: string | null,
    readonly age: boolean,
    readonly id: string,
    readonly topic: string,
    readonly date: Date,
    readonly user: string,
    readonly votes: Im.List<IVote>,
    readonly lv: number,
    readonly hash: string,
    readonly replyCount: number) {
    super(ResNormal);
  }

  toDB(): IResNormalDB {
    return this.toBaseDB({
      name: this.name,
      text: this.text,
      reply: this.reply,
      deleteFlag: this.deleteFlag,
      profile: this.profile,
      age: this.age,
    });
  }

  toAPI(authToken: IAuthToken | null): IResNormalAPI | IResDeleteAPI {
    if (this.deleteFlag === "active") {
      return {
        ...this.toBaseAPI(authToken),
        name: this.name,
        text: this.text,
        replyID: this.reply !== null ? this.reply.res : null,
        profileID: this.profile !== null ? this.profile : null,
        isReply: authToken === null || this.reply === null ? null : authToken.user === this.reply.user,
      };
    } else {
      return {
        ...this.toBaseAPI(authToken),
        type: "delete",
        flag: this.deleteFlag,
      };
    }
  }

  del(resUser: User, authToken: IAuthToken) {
    if (authToken.user !== this.user) {
      throw new AtRightError("人の書き込み削除は出来ません");
    }

    if (this.deleteFlag !== "active") {
      throw new AtPrerequisiteError("既に削除済みです");
    }

    const newResUser = resUser.changeLv(resUser.lv - 1);
    return {
      res: this.copy({
        deleteFlag: "self",
      }),
      resUser: newResUser,
    };
  }
}
applyMixins(ResNormal, [ResBase]);

export class ResHistory extends Copyable<ResHistory> implements ResBase<"history", ResHistory> {
  static fromDB(r: IResHistoryDB, replyCount: number): ResHistory {
    return new ResHistory(r.body.history,
      r.id,
      r.body.topic,
      new Date(r.body.date),
      r.body.user,
      Im.List(r.body.votes),
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
    now: Date) {
    const result = new ResHistory(history.id,
      objidGenerator(),
      topic.id,
      now,
      user.id,
      Im.List(),
      user.lv * 5,
      topic.hash(now, user),
      0);

    const newTopic = topic.resUpdate(result);
    return { res: result, topic: newTopic };
  }

  toBaseAPI!: (authToken: IAuthToken | null) => IResBaseAPI<"history">;
  toBaseDB!: <Body extends object>(body: Body) => IResBaseDB<"history", Body>;
  cv!: (resUser: User, user: User, _authToken: IAuthToken) => { res: ResHistory, resUser: User };
  _v!: (resUser: User, user: User, type: "uv" | "dv", _authToken: IAuthToken) => { res: ResHistory, resUser: User };
  v!: (resUser: User, user: User, type: "uv" | "dv", _authToken: IAuthToken) => { res: ResHistory, resUser: User };

  readonly type: "history" = "history";

  constructor(
    readonly history: string,
    readonly id: string,
    readonly topic: string,
    readonly date: Date,
    readonly user: string,
    readonly votes: Im.List<IVote>,
    readonly lv: number,
    readonly hash: string,
    readonly replyCount: number) {
    super(ResHistory);
  }

  toDB(): IResHistoryDB {
    return this.toBaseDB({ history: this.history });
  }

  toAPI(authToken: IAuthToken | null): IResHistoryAPI {
    return {
      ...this.toBaseAPI(authToken),
      historyID: this.history,
    };
  }
}
applyMixins(ResHistory, [ResBase]);

export class ResTopic extends Copyable<ResTopic> implements ResBase<"topic", ResTopic> {
  static fromDB(r: IResTopicDB, replyCount: number): ResTopic {
    return new ResTopic(r.id,
      r.body.topic,
      new Date(r.body.date),
      r.body.user,
      Im.List(r.body.votes),
      r.body.lv,
      r.body.hash,
      replyCount);
  }

  static create<TC extends TopicOne | TopicFork>(
    objidGenerator: IGenerator<string>,
    topic: TC,
    user: User,
    _authToken: IAuthToken,
    now: Date) {
    const result = new ResTopic(objidGenerator(),
      topic.id,
      now,
      user.id,
      Im.List(),
      user.lv * 5,
      topic.hash(now, user),
      0);

    // TODO:キャストなしで書きたい
    const newTopic = topic.resUpdate(result) as TC;
    return { res: result, topic: newTopic };
  }

  toBaseAPI!: (authToken: IAuthToken | null) => IResBaseAPI<"topic">;
  toBaseDB!: <Body extends object>(body: Body) => IResBaseDB<"topic", Body>;
  cv!: (resUser: User, user: User, _authToken: IAuthToken) => { res: ResTopic, resUser: User };
  _v!: (resUser: User, user: User, type: "uv" | "dv", _authToken: IAuthToken) => { res: ResTopic, resUser: User };
  v!: (resUser: User, user: User, type: "uv" | "dv", _authToken: IAuthToken) => { res: ResTopic, resUser: User };

  readonly type: "topic" = "topic";

  constructor(
    readonly id: string,
    readonly topic: string,
    readonly date: Date,
    readonly user: string,
    readonly votes: Im.List<IVote>,
    readonly lv: number,
    readonly hash: string,
    readonly replyCount: number) {
    super(ResTopic);
  }

  toDB(): IResTopicDB {
    return this.toBaseDB({});
  }

  toAPI(authToken: IAuthToken | null): IResTopicAPI {
    return this.toBaseAPI(authToken);
  }
}
applyMixins(ResTopic, [ResBase]);

export class ResFork extends Copyable<ResFork> implements ResBase<"fork", ResFork> {
  static fromDB(r: IResForkDB, replyCount: number): ResFork {
    return new ResFork(r.body.fork,
      r.id,
      r.body.topic,
      new Date(r.body.date),
      r.body.user,
      Im.List(r.body.votes),
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
    now: Date) {
    const result = new ResFork(fork.id,
      objidGenerator(),
      topic.id,
      now,
      user.id,
      Im.List(),
      user.lv * 5,
      topic.hash(now, user),
      0);

    const newTopic = topic.resUpdate(result);
    return { res: result, topic: newTopic };
  }

  toBaseAPI!: (authToken: IAuthToken | null) => IResBaseAPI<"fork">;
  toBaseDB!: <Body extends object>(body: Body) => IResBaseDB<"fork", Body>;
  cv!: (resUser: User, user: User, _authToken: IAuthToken) => { res: ResFork, resUser: User };
  _v!: (resUser: User, user: User, type: "uv" | "dv", _authToken: IAuthToken) => { res: ResFork, resUser: User };
  v!: (resUser: User, user: User, type: "uv" | "dv", _authToken: IAuthToken) => { res: ResFork, resUser: User };

  readonly type: "fork" = "fork";

  constructor(
    readonly fork: string,
    readonly id: string,
    readonly topic: string,
    readonly date: Date,
    readonly user: string,
    readonly votes: Im.List<IVote>,
    readonly lv: number,
    readonly hash: string,
    readonly replyCount: number) {
    super(ResFork);
  }

  toDB(): IResForkDB {
    return this.toBaseDB({ fork: this.fork });
  }

  toAPI(authToken: IAuthToken | null): IResForkAPI {
    return {
      ...this.toBaseAPI(authToken),
      forkID: this.fork,
    };
  }
}
applyMixins(ResFork, [ResBase]);
