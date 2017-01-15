import { ObjectID } from 'mongodb';
import { User } from './user';
import { Topic } from './topic';
import { Profile } from './profile';
import { Msg } from './msg';
import { DB } from '../db';
import { IAuthToken } from '../auth';
import { AtError, StatusCode } from '../at-error'
import { Config } from '../config';
import { StringUtil } from '../util';

export interface IResDB {
  _id: ObjectID,
  topic: ObjectID,
  date: Date,
  user: ObjectID,
  name: string,
  text: string,
  mdtext: string,
  reply: { res: ObjectID, user: ObjectID } | null,
  deleteFlag: ResDeleteFlag,
  vote: number,
  voteUser: ObjectID[],
  lv: number,
  hash: string,
  profile: ObjectID | null
}

export interface IResAPI {
  id: string,
  topic: string,
  date: string,
  user: string | null,
  name: string,
  text: string,
  mdtext: string,
  reply: string | null,
  deleteFlag: ResDeleteFlag,
  vote: number,
  hash: string,
  profile: string | null,
  replyCount: number,
  isVote: boolean | null,
  isReply: boolean | null
}

export type ResDeleteFlag = "active" | "self" | "vote" | "freeze";

export class Res {
  static writeListener = new Set<(res: Res) => void>();


  private constructor(private _id: ObjectID,
    private _topic: ObjectID,
    private _date: Date,
    private _user: ObjectID,
    private _name: string,
    private _text: string,
    private _mdtext: string,
    private _reply: { res: ObjectID, user: ObjectID } | null,
    private _deleteFlag: ResDeleteFlag,
    private _vote: number,
    private _voteUser: ObjectID[],
    private _lv: number,
    private _hash: string,
    private _profile: ObjectID | null,
    private _replyCount: number) {
  }

  get id(): ObjectID {
    return this._id;
  }

  get user(): ObjectID {
    return this._user;
  }

  get topic(): ObjectID {
    return this._topic;
  }

  static async findOne(id: ObjectID): Promise<Res> {
    let db = await DB;
    let res: IResDB | null = await db.collection("reses").findOne({ _id: id });

    if (res === null) {
      throw new AtError(StatusCode.NotFound, "レスが存在しません");
    }

    return (await this.aggregate([res]))[0];
  }

  static async findIn(ids: ObjectID[]): Promise<Res[]> {
    let db = await DB;
    let reses: IResDB[] = await db.collection("reses").find({ _id: { $in: ids } })
      .sort({ date: -1 })
      .toArray();

    if (reses.length !== ids.length) {
      throw new AtError(StatusCode.NotFound, "レスが存在しません");
    }

    return this.aggregate(reses);
  }

  static async find(topic: Topic, type: "before" | "after", equal: boolean, date: Date, limit: number): Promise<Res[]> {
    let db = await DB;
    let reses: IResDB[] = await db.collection("reses")
      .find({
        topic: topic.id,
        date: { [type === "after" ? (equal ? "$gte" : "$gt") : (equal ? "$lte" : "$lt")]: date }
      })
      .sort({ date: type === "after" ? 1 : -1 })
      .skip(0)
      .limit(limit)
      .sort({ date: -1 })
      .toArray();

    return this.aggregate(reses);
  }

  static async findNew(topic: Topic, limit: number): Promise<Res[]> {
    let db = await DB;
    let reses: IResDB[] = await db.collection("reses")
      .find({
        topic: topic.id,
      })
      .sort({ date: -1 })
      .skip(0)
      .limit(limit)
      .toArray();


    return this.aggregate(reses);
  }

  static async findNotice(authToken: IAuthToken, type: "before" | "after", equal: boolean, date: Date, limit: number): Promise<Res[]> {
    let db = await DB;
    let reses: IResDB[] = await db.collection("reses")
      .find({
        "reply.user": authToken.user,
        date: { [type === "after" ? (equal ? "$gte" : "$gt") : (equal ? "$lte" : "$lt")]: date }
      })
      .sort({ date: type === "after" ? 1 : -1 })
      .skip(0)
      .limit(limit)
      .sort({ date: -1 })
      .toArray();


    return this.aggregate(reses);
  }

  static async findNoticeNew(authToken: IAuthToken, limit: number): Promise<Res[]> {
    let db = await DB;
    let reses: IResDB[] = await db.collection("reses")
      .find({
        "reply.user": authToken.user
      })
      .sort({ date: -1 })
      .skip(0)
      .limit(limit)
      .toArray();

    return this.aggregate(reses);
  }

  static async findHash(topic: Topic, hash: string): Promise<Res[]> {
    let db = await DB;
    let reses: IResDB[] = await db.collection("reses")
      .find({
        topic: topic.id,
        hash: hash
      })
      .sort({ date: -1 })
      .toArray();

    return this.aggregate(reses);
  }

  static async findReply(topic: Topic, res: Res): Promise<Res[]> {
    let db = await DB;
    let reses: IResDB[] = await db.collection("reses")
      .find({
        topic: topic.id,
        "reply.res": res._id
      })
      .sort({ date: -1 })
      .toArray();

    return this.aggregate(reses);
  }

  private static async aggregate(reses: IResDB[]): Promise<Res[]> {
    let db = await DB;
    let countArr: { _id: ObjectID, replyCount: number }[] = await db.collection("reses")
      .aggregate([
        {
          $group: {
            _id: "$reply.res", replyCount: { $sum: 1 }
          }
        },
        {
          $match: {
            _id: { $in: reses.map(x => x._id) }
          }
        }
      ])
      .toArray();

    let count = new Map<string, number>();
    countArr.forEach(r => count.set(r._id.toString(), r.replyCount));

    return reses.map(r => this.fromDB(r,
      count.has(r._id.toString()) ? count.get(r._id.toString()) as number : 0));
  }

  static async insert(res: Res): Promise<null> {
    let db = await DB;
    await db.collection("reses").insert(res.toDB());
    this.writeListener.forEach(x => x(res));
    return null;
  }

  static async update(res: Res): Promise<null> {
    let db = await DB;
    await db.collection("reses").update({ _id: res._id }, res.toDB());
    return null;
  }

  toDB(): IResDB {
    return {
      _id: this._id,
      topic: this._topic,
      date: this._date,
      user: this._user,
      name: this._name,
      text: this._text,
      mdtext: this._mdtext,
      reply: this._reply,
      deleteFlag: this._deleteFlag,
      vote: this._vote,
      voteUser: this._voteUser,
      lv: this._lv,
      hash: this._hash,
      profile: this._profile
    };
  }

  toAPI(authToken: IAuthToken | null): IResAPI {
    let name = "";
    let text = "";
    let mdtext = "";
    switch (this._deleteFlag) {
      case "active":
        name = this._name;
        text = this._text;
        mdtext = this._mdtext;
        break;
      case "self":
        name = "■削除";
        text = "投稿者により削除されました。";
        mdtext = "<p>" + text + "</p>";
        break;
      case "vote":
        name = "■削除";
        text = "投票により削除されました。";
        mdtext = "<p>" + text + "</p>";
        break;
      case "freeze":
        name = "■削除";
        text = "管理人により削除されました。";
        mdtext = "<p>" + text + "</p>";
        break;
    }

    let isVote: boolean | null;
    if (authToken === null) {
      isVote = null;
    } else {
      isVote = this._voteUser.find((id) => authToken.user.equals(id)) !== undefined;
    }

    return {
      id: this._id.toString(),
      topic: this._topic.toString(),
      date: this._date.toISOString(),
      user: (authToken !== null && authToken.user.equals(this._user) ? this._user.toString() : null),
      name: name,
      text: text,
      mdtext: mdtext,
      reply: this._reply !== null ? this._reply.res.toString() : null,
      deleteFlag: this._deleteFlag,
      vote: this._vote,
      hash: this._hash,
      profile: this._profile !== null ? this._profile.toString() : null,
      replyCount: this._replyCount,
      isVote,
      isReply: authToken === null || this._reply === null ? null : authToken.user.equals(this._reply.user)
    };
  }

  static fromDB(r: IResDB, replyCount: number): Res {
    return new Res(r._id, r.topic, r.date, r.user, r.name, r.text, r.mdtext, r.reply, r.deleteFlag, r.vote, r.voteUser, r.lv, r.hash, r.profile, replyCount)
  }

  static create(topic: Topic, user: User, _authToken: IAuthToken, name: string, autoName: string | null, text: string, reply: Res | null, profile: Profile | null): Res {
    if (!name.match(Config.res.name.regex)) {
      throw new AtError(StatusCode.MisdirectedRequest, Config.res.name.msg);
    }
    if (!text.match(Config.res.text.regex)) {
      throw new AtError(StatusCode.MisdirectedRequest, Config.res.text.msg);
    }

    let date = new Date();

    //名前生成
    name = StringUtil.graphicEscape(name);
    if (name.length === 0 && autoName === null && profile === null) {
      name = Config.res.defaultName;
    }

    if (profile !== null) {
      name += "●" + profile.id.toString();
    }

    if (autoName !== null) {
      name += "■" + autoName;
    }

    if (profile !== null) {
      //自分のプロフィールか？
      if (!profile.user.equals(user.id)) {
        throw new AtError(StatusCode.MisdirectedRequest, "自分のプロフィールを指定して下さい。");
      }
    }

    //もしリプ先があるかつ、トピックがリプ先と違えばエラー
    if (reply !== null && !reply.topic.equals(topic.id)) {
      throw new AtError(StatusCode.MisdirectedRequest, "他のトピックのレスへのリプは出来ません");
    }

    if (autoName === null) {
      user.changeLastRes(date);
    }
    topic.update = date;
    return new Res(new ObjectID(),
      topic.id,
      date,
      user.id,
      name,
      text,
      StringUtil.md(text),
      reply !== null ? { res: reply._id, user: reply._user } : null,
      "active",
      0,
      [],
      user.lv * 5,
      topic.hash(date, user),
      profile !== null ? profile.id : null,
      0);
  }

  uv(resUser: User, user: User, _authToken: IAuthToken) {
    if (user.id.equals(this._user)) {
      throw new AtError(StatusCode.Forbidden, "自分に投票は出来ません");
    }
    if (this._voteUser.find(x => x.equals(user.id)) !== undefined) {
      throw new AtError(StatusCode.Forbidden, "投票は一回までです");
    }
    this._voteUser.push(user.id);
    resUser.changeLv(resUser.lv + Math.floor(user.lv / 100) + 1);
    this._vote += user.lv;
  }

  dv(resUser: User, user: User, _authToken: IAuthToken): Msg | null {
    if (user.id.equals(this._user)) {
      throw new AtError(StatusCode.Forbidden, "自分に投票は出来ません");
    }
    if (this._voteUser.find(x => x.equals(user.id)) !== undefined) {
      throw new AtError(StatusCode.Forbidden, "投票は一回までです");
    }
    this._voteUser.push(user.id);
    resUser.changeLv(resUser.lv - Math.floor(user.lv / 100) - 1);
    //低評価1回で削除されないように
    this._vote -= Math.min(user.lv, Math.ceil(this._lv / 3));

    let msg: Msg | null;
    if (this._vote < -this._lv && (this._deleteFlag === "active" || this._deleteFlag === "self")) {
      this._deleteFlag = "vote";
      msg = Msg.create(resUser, "投票により書き込みが削除されました。");
    } else {
      msg = null;
    }
    return msg;
  }

  del(resUser: User, authToken: IAuthToken) {
    if (!authToken.user.equals(this._user)) {
      throw new AtError(StatusCode.Forbidden, "人の書き込み削除は出来ません");
    }

    if (this._deleteFlag !== "active") {
      throw new AtError(StatusCode.Conflict, "既に削除済みです");
    }

    this._deleteFlag = "self";
    resUser.changeLv(resUser.lv - 1);
  }
}