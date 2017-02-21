import { ObjectID } from 'mongodb';
import { User } from '../user';
import { Topic } from '../topic';
import { Profile } from '../profile';
import { Msg } from '../msg';
import { IAuthToken } from '../../auth';
import { AtError, StatusCode } from '../../at-error'
import { Config } from '../../config';
import { StringUtil } from '../../util';
import { IGenerator } from '../../generator';

export interface IVote {
  user: ObjectID,
  value: number,
  lv: number
}

export interface IResDB {
  _id: ObjectID,
  topic: ObjectID,
  date: Date,
  user: ObjectID,
  name: string,
  text: string,
  mdtext: string,
  reply: IReply | null,
  deleteFlag: ResDeleteFlag,
  vote: IVote[],
  lv: number,
  hash: string,
  profile: ObjectID | null,
  age: boolean
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
  uv: number,
  dv: number,
  hash: string,
  profile: string | null,
  replyCount: number,
  voteFlag: VoteFlag | null,
  isReply: boolean | null
}

export type VoteFlag = "uv" | "dv" | "not";
export type ResDeleteFlag = "active" | "self" | "vote" | "freeze";
export interface IReply{
  res: ObjectID;
  user: ObjectID;
}

export class Res {
  static writeListener = new Set<(res: Res) => void>();

  private constructor(private _id: ObjectID,
    private _topic: ObjectID,
    private _date: Date,
    private _user: ObjectID,
    private _name: string,
    private _text: string,
    private _mdtext: string,
    private _reply: IReply | null,
    private _deleteFlag: ResDeleteFlag,
    private _vote: IVote[],
    private _lv: number,
    private _hash: string,
    private _profile: ObjectID | null,
    private _replyCount: number,
    private _age: boolean) {
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

  get name() {
    return this._name;
  }

  get text(){
    return this._text;
  }

  get mdtext(){
    return this._mdtext;
  }

  get reply(){
    return this._reply;
  }

  get deleteFlag(){
    return this._deleteFlag;
  }

  get vote(){
    return this._vote;
  }

  get lv(){
    return this._lv;
  }

  get hash(){
    return this._hash;
  }

  get profile(){
    return this._profile;
  }

  get replyCount(){
    return this._replyCount;
  }

  get age(){
    return this._age;
  }

  get voteValue(): number {
    if (this._vote.length === 0) {
      return 0;
    } else {
      return this._vote
        .map(x => x.value)
        .reduce((x, y) => x + y);
    }
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
      lv: this._lv,
      hash: this._hash,
      profile: this._profile,
      age: this._age
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
      date: this._date.toISOString(),
      user: (authToken !== null && authToken.user.equals(this._user) ? this._user.toString() : null),
      name: name,
      text: text,
      mdtext: mdtext,
      reply: this._reply !== null ? this._reply.res.toString() : null,
      deleteFlag: this._deleteFlag,
      uv: this._vote.filter(x => x.value > 0).length,
      dv: this._vote.filter(x => x.value < 0).length,
      hash: this._hash,
      profile: this._profile !== null ? this._profile.toString() : null,
      replyCount: this._replyCount,
      voteFlag,
      isReply: authToken === null || this._reply === null ? null : authToken.user.equals(this._reply.user)
    };
  }

  static fromDB(r: IResDB, replyCount: number): Res {
    return new Res(r._id, r.topic, r.date, r.user, r.name, r.text, r.mdtext, r.reply, r.deleteFlag, r.vote, r.lv, r.hash, r.profile, replyCount, r.age)
  }

  static create(objidGenerator: IGenerator<ObjectID>, topic: Topic, user: User, _authToken: IAuthToken, name: string, autoName: string | null, text: string, reply: Res | null, profile: Profile | null, age: boolean, now: Date): Res {
    if (!name.match(Config.res.name.regex)) {
      throw new AtError(StatusCode.MisdirectedRequest, Config.res.name.msg);
    }
    if (!text.match(Config.res.text.regex)) {
      throw new AtError(StatusCode.MisdirectedRequest, Config.res.text.msg);
    }


    //名前生成
    name = StringUtil.graphicEscape(name);
    if (name.length === 0 && autoName === null && profile === null) {
      name = Config.res.defaultName;
    }

    if (profile !== null) {
      name += "●" + profile.sn;
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
      user.changeLastRes(now);
    }

    let result = new Res(objidGenerator.get(),
      topic.id,
      now,
      user.id,
      name,
      text,
      StringUtil.md(text),
      reply !== null ? { res: reply._id, user: reply._user } : null,
      "active",
      [],
      user.lv * 5,
      topic.hash(now, user),
      profile !== null ? profile.id : null,
      0,
      age);
    topic.resUpdate(result);
    return result;
  }

  uv(resUser: User, user: User, _authToken: IAuthToken) {
    if (user.id.equals(this._user)) {
      throw new AtError(StatusCode.Forbidden, "自分に投票は出来ません");
    }
    if (this._vote.find(x => x.user.equals(user.id)) !== undefined) {
      throw new AtError(StatusCode.Forbidden, "既に投票しています");
    }
    let lv = Math.floor(user.lv / 100) + 1;
    this._vote.push({ user: user.id, value: user.lv, lv });
    resUser.changeLv(resUser.lv + lv);
  }

  dv(objidGenerator: IGenerator<ObjectID>, resUser: User, user: User, _authToken: IAuthToken, now: Date): Msg | null {
    if (user.id.equals(this._user)) {
      throw new AtError(StatusCode.Forbidden, "自分に投票は出来ません");
    }
    if (this._vote.find(x => x.user.equals(user.id)) !== undefined) {
      throw new AtError(StatusCode.Forbidden, "既に投票しています");
    }

    let lv = -Math.floor(user.lv / 100) - 1;
    this._vote.push({ user: user.id, value: -Math.min(user.lv, Math.ceil(this._lv / 3)), lv });
    resUser.changeLv(resUser.lv + lv);


    let msg: Msg | null;
    if (this.voteValue < -this._lv && (this._deleteFlag === "active" || this._deleteFlag === "self")) {
      this._deleteFlag = "vote";
      msg = Msg.create(objidGenerator, resUser, "投票により書き込みが削除されました。", now);
    } else {
      msg = null;
    }
    return msg;
  }

  cv(resUser: User, user: User, _authToken: IAuthToken) {
    let vote = this._vote.find(x => x.user.equals(user.id));
    if (vote === undefined) {
      throw new AtError(StatusCode.Forbidden, "投票していません");
    }
    this._vote.splice(this._vote.indexOf(vote), 1);
    resUser.changeLv(resUser.lv - vote.value);
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