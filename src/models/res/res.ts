import * as Im from "immutable";
import Copyable, { PartialMap } from "ts-copyable";
import {
  AtPrerequisiteError,
  AtRightError,
  paramsErrorMaker,
} from "../../at-error";
import { IAuthToken } from "../../auth";
import { Config } from "../../config";
import { IGenerator } from "../../generator";
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

export abstract class ResBase<T extends ResType, C extends ResBase<T, C>> {
  abstract readonly id: string;
  abstract readonly topic: string;
  abstract readonly date: Date;
  abstract readonly user: string;
  abstract readonly vote: Im.List<IVote>;
  abstract readonly lv: number;
  abstract readonly hash: string;
  abstract readonly type: T;
  abstract readonly replyCount: number;

  abstract copy(partial: Partial<ResBase<T, C>>): C;
  abstract mapCopy(partial: PartialMap<ResBase<T, C>>): C;

  v(resUser: User, user: User, type: "uv" | "dv", _authToken: IAuthToken): { res: C } {
    if (user.id === this.user) {
      throw new AtRightError("自分に投票は出来ません");
    }
    if (this.vote.find(x => x.user === user.id) !== undefined) {
      throw new AtPrerequisiteError("既に投票しています");
    }
    const valueAbs = Math.floor(user.lv / 100) + 1;
    const value = type === "uv" ? valueAbs : -valueAbs;
    resUser.changeLv(resUser.lv + value);
    return {
      res: this.copy({
        vote: this.vote.push({ user: user.id, value }),
      }),
    };
  }

  cv(resUser: User, user: User, _authToken: IAuthToken): { res: C } {
    const vote = this.vote.find(x => x.user === user.id);
    if (vote === undefined) {
      throw new AtPrerequisiteError("投票していません");
    }
    resUser.changeLv(resUser.lv - vote.value);
    return {
      res: this.copy({
        vote: this.vote.remove(this.vote.indexOf(vote)),
      }),
    };
  }

  toBaseDB<Body extends object>(body: Body): IResBaseDB<T, Body> {
    return {
      id: this.id,
      type: this.type,
      body: Object.assign({}, body, {
        topic: this.topic,
        date: this.date.toISOString(),
        user: this.user,
        vote: this.vote.toArray(),
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
      const vote = this.vote.find(v => authToken.user === v.user);
      if (vote === undefined) {
        voteFlag = "not";
      } else {
        voteFlag = vote.value > 0 ? "uv" : "dv";
      }
    }

    return {
      id: this.id,
      topic: this.topic,
      date: this.date,
      user: (authToken !== null && authToken.user === this.user ? this.user : null),
      uv: this.vote.filter(x => x.value > 0).size,
      dv: this.vote.filter(x => x.value < 0).size,
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
      r.body.body,
      r.body.reply,
      r.body.deleteFlag,
      r.body.profile,
      r.body.age,
      r.id,
      r.body.topic,
      new Date(r.body.date),
      r.body.user,
      Im.List(r.body.vote),
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
      Im.List(),
      user.lv * 5,
      topic.hash(now, user),
      0);

    topic.resUpdate(result);
    return result;
  }

  readonly type: "normal" = "normal";

  toBaseAPI: (authToken: IAuthToken | null) => IResBaseAPI<"normal">;
  toBaseDB: <Body extends object>(body: Body) => IResBaseDB<"normal", Body>;
  cv: (resUser: User, user: User, _authToken: IAuthToken) => { res: ResNormal };
  v: (resUser: User, user: User, type: "uv" | "dv", _authToken: IAuthToken) => { res: ResNormal };

  constructor(
    readonly name: string | null,
    readonly body: string,
    readonly reply: IReply | null,
    readonly deleteFlag: ResDeleteFlag,
    readonly profile: string | null,
    readonly age: boolean,
    readonly id: string,
    readonly topic: string,
    readonly date: Date,
    readonly user: string,
    readonly vote: Im.List<IVote>,
    readonly lv: number,
    readonly hash: string,
    readonly replyCount: number) {
    super(ResNormal);
  }

  toDB(): IResNormalDB {
    return this.toBaseDB({
      name: this.name,
      body: this.body,
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
        body: this.body,
        reply: this.reply !== null ? this.reply.res : null,
        profile: this.profile !== null ? this.profile : null,
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

    resUser.changeLv(resUser.lv - 1);
    return {
      res: this.copy({
        deleteFlag: "self",
      }),
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
      Im.List(r.body.vote),
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
      Im.List(),
      user.lv * 5,
      topic.hash(now, user),
      0);

    topic.resUpdate(result);
    return result;
  }

  toBaseAPI: (authToken: IAuthToken | null) => IResBaseAPI<"history">;
  toBaseDB: <Body extends object>(body: Body) => IResBaseDB<"history", Body>;
  cv: (resUser: User, user: User, _authToken: IAuthToken) => { res: ResHistory };
  v: (resUser: User, user: User, type: "uv" | "dv", _authToken: IAuthToken) => { res: ResHistory };

  readonly type: "history" = "history";

  constructor(
    readonly history: string,
    readonly id: string,
    readonly topic: string,
    readonly date: Date,
    readonly user: string,
    readonly vote: Im.List<IVote>,
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
      history: this.history,
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
      Im.List(r.body.vote),
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
      Im.List(),
      user.lv * 5,
      topic.hash(now, user),
      0);

    topic.resUpdate(result);
    return result;
  }

  toBaseAPI: (authToken: IAuthToken | null) => IResBaseAPI<"topic">;
  toBaseDB: <Body extends object>(body: Body) => IResBaseDB<"topic", Body>;
  cv: (resUser: User, user: User, _authToken: IAuthToken) => { res: ResTopic };
  v: (resUser: User, user: User, type: "uv" | "dv", _authToken: IAuthToken) => { res: ResTopic };

  readonly type: "topic" = "topic";

  constructor(
    readonly id: string,
    readonly topic: string,
    readonly date: Date,
    readonly user: string,
    readonly vote: Im.List<IVote>,
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
      Im.List(r.body.vote),
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
      Im.List(),
      user.lv * 5,
      topic.hash(now, user),
      0);

    topic.resUpdate(result);
    return result;
  }

  toBaseAPI: (authToken: IAuthToken | null) => IResBaseAPI<"fork">;
  toBaseDB: <Body extends object>(body: Body) => IResBaseDB<"fork", Body>;
  cv: (resUser: User, user: User, _authToken: IAuthToken) => { res: ResFork };
  v: (resUser: User, user: User, type: "uv" | "dv", _authToken: IAuthToken) => { res: ResFork };

  readonly type: "fork" = "fork";

  constructor(
    readonly fork: string,
    readonly id: string,
    readonly topic: string,
    readonly date: Date,
    readonly user: string,
    readonly vote: Im.List<IVote>,
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
      fork: this.fork,
    };
  }
}
applyMixins(ResFork, [ResBase]);
