import { ObjectID } from 'mongodb';
import { IAuthUser } from '../../auth';
import { paramsErrorMaker, AtUserAuthError, AtPrerequisiteError } from '../../at-error'
import { Config } from '../../config';
import { StringUtil } from '../../util';
import { IGenerator } from '../../generator';

export interface IUserDB {
  _id: ObjectID,
  sn: string,
  pass: string,
  lv: number,
  resWait: IResWait,
  lastTopic: Date,
  date: Date,
  point: number
  lastOneTopic: Date
}

export interface IUserAPI {
  id: string,
  sn: string
}

export interface IResWait {
  last: Date,
  m10: number,
  m30: number,
  h1: number,
  h6: number,
  h12: number,
  d1: number
}

export class User {
  private constructor(private _id: ObjectID,
    private _sn: string,
    private _pass: string,
    private _lv: number,
    private _resWait: IResWait,
    private _lastTopic: Date,
    private _date: Date,
    //毎日リセットされ、特殊動作をすると増えるポイント
    private _point: number,
    private _lastOneTopic: Date) {
  }

  get id() {
    return this._id;
  }

  get sn() {
    return this._sn;
  }

  get pass() {
    return this._pass;
  }

  get lv() {
    return this._lv;
  }

  get resWait() {
    return this._resWait;
  }

  get lastTopic() {
    return this._lastTopic;
  }

  get date() {
    return this._date;
  }

  get point() {
    return this._point;
  }

  get lastOneTopic() {
    return this._lastOneTopic;
  }

  toDB(): IUserDB {
    return {
      _id: this._id,
      sn: this._sn,
      pass: this._pass,
      lv: this._lv,
      resWait: this._resWait,
      lastTopic: this._lastTopic,
      date: this._date,
      point: this._point,
      lastOneTopic: this._lastOneTopic
    }
  }

  toAPI(): IUserAPI {
    return {
      id: this._id.toString(),
      sn: this._sn
    }
  }

  static fromDB(u: IUserDB): User {
    return new User(u._id, u.sn, u.pass, u.lv, u.resWait, u.lastTopic, u.date, u.point, u.lastOneTopic);
  }

  static create(objidGenerator: IGenerator<ObjectID>, sn: string, pass: string, now: Date): User {
    paramsErrorMaker([
      {
        field: "pass",
        val: pass,
        regex: Config.user.pass.regex,
        message: Config.user.pass.msg
      },
      {
        field: "sn",
        val: sn,
        regex: Config.user.sn.regex,
        message: Config.user.sn.msg
      }
    ]);

    return new User(objidGenerator.get(),
      sn,
      StringUtil.hash(pass + Config.salt.pass),
      1,
      { last: now, m10: 0, m30: 0, h1: 0, h6: 0, h12: 0, d1: 0 },
      now,
      now,
      0,
      now);
  }

  change(_authUser: IAuthUser, pass: string, sn: string) {
    paramsErrorMaker([
      {
        field: "pass",
        val: pass,
        regex: Config.user.pass.regex,
        message: Config.user.pass.msg
      },
      {
        field: "sn",
        val: sn,
        regex: Config.user.sn.regex,
        message: Config.user.sn.msg
      }
    ]);

    this._pass = StringUtil.hash(pass + Config.salt.pass);
    this._sn = sn;
  }

  auth(pass: String): IAuthUser {
    if (this._pass === StringUtil.hash(pass + Config.salt.pass)) {
      return { id: this._id, pass: this._pass };
    } else {
      throw new AtUserAuthError();
    }
  }

  usePoint(val: number) {
    if (this._lv < this._point + val) {
      throw new AtPrerequisiteError("LVが足りません");
    }
    this._point += val;
  }

  changeLv(lv: number) {
    if (lv < 1) {
      this._lv = 1;
    } else if (lv > Config.user.lvMax) {
      this._lv = Config.user.lvMax;
    } else {
      this._lv = lv;;
    }
  }

  changeLastRes(lastRes: Date) {
    //条件
    //係数
    const coe = (this._lv / Config.user.lvMax) * (Config.res.wait.maxLv - 1) + 1;
    if (
      this._resWait.d1 < Config.res.wait.d1 * coe &&
      this._resWait.h12 < Config.res.wait.h12 * coe &&
      this._resWait.h6 < Config.res.wait.h6 * coe &&
      this._resWait.h1 < Config.res.wait.h1 * coe &&
      this._resWait.m30 < Config.res.wait.m30 * coe &&
      this._resWait.m10 < Config.res.wait.m10 * coe &&
      this._resWait.last.getTime() + 1000 * Config.res.wait.minSecond < lastRes.getTime()
    ) {
      this._resWait.d1++;
      this._resWait.h12++;
      this._resWait.h6++;
      this._resWait.h1++;
      this._resWait.m30++;
      this._resWait.m10++;
      this._resWait.last = lastRes;
    } else {
      throw new AtPrerequisiteError("連続書き込みはできません");
    }
  }
  changeLastTopic(lastTopic: Date) {
    if (this._lastTopic.getTime() + 1000 * 60 * 30 < lastTopic.getTime()) {
      this._lastTopic = lastTopic;
    } else {
      throw new AtPrerequisiteError("連続書き込みはできません");
    }
  }

  changeLastOneTopic(lastTopic: Date) {
    if (this._lastOneTopic.getTime() + 1000 * 60 * 10 < lastTopic.getTime()) {
      this._lastOneTopic = lastTopic;
    } else {
      throw new AtPrerequisiteError("連続書き込みはできません");
    }
  }
}