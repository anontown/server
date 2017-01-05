import { ObjectID, WriteError } from 'mongodb';
import { DB } from '../db';
import { IAuthUser } from '../auth';
import { AtError, StatusCode } from '../at-error'
import { Config } from '../config';
import { StringUtil } from '../util';
import { CronJob } from 'cron';

interface IUserDB {
  _id: ObjectID,
  sn: string,
  pass: string,
  lv: number,
  resWait: IResWait,
  lastTopic: Date,
  date: Date,
  point: number
}

export interface IUserAPI {
  id: string,
  sn: string
}

interface IResWait {
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
    private _point: number) {

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
      point: this._point
    }
  }

  toAPI(): IUserAPI {
    return {
      id: this._id.toString(),
      sn: this._sn
    }
  }

  static async findOne(id: ObjectID): Promise<User> {
    let db = await DB;
    let user: IUserDB | null = await db.collection("users").findOne({ _id: id });

    if (user === null) {
      throw new AtError(StatusCode.NotFound, "ユーザーが存在しません");
    }

    return this.fromDB(user);
  }

  static async findID(sn: string): Promise<ObjectID> {
    let db = await DB;
    let user: IUserDB | null = await db.collection("users").findOne({ sn });

    if (user === null) {
      throw new AtError(StatusCode.NotFound, "ユーザーが存在しません");
    }

    return user._id;
  }
  static async insert(user: User): Promise<null> {
    let db = await DB;
    await db.collection("users").insert(user.toDB()).catch((e: WriteError) => {
      if (e.code === 11000) {
        throw new AtError(StatusCode.Conflict, "スクリーンネームが使われています");
      } else {
        throw e;
      }
    });
    return null;
  }

  static async update(user: User): Promise<null> {
    let db = await DB;
    await db.collection("users").update({ _id: user._id }, user.toDB());
    return null;
  }

  static fromDB(u: IUserDB): User {
    return new User(u._id, u.sn, u.pass, u.lv, u.resWait, u.lastTopic, u.date, u.point);
  }

  get id(): ObjectID {
    return this._id;
  }

  get lv(): number {
    return this._lv;
  }

  static cron() {
    let start = (cronTime: string, field: string) => {
      new CronJob({
        cronTime,
        onTick: async () => {
          console.log("UserCron", field);
          let db = await DB;
          await db.collection("users").update({}, { $set: { ["resWait." + field]: 0 } }, { multi: true });
        },
        start: false,
        timeZone: 'Asia/Tokyo'
      }).start();
    }

    start('00 00,10,20,30,40,50 * * * *', "m10");
    start('00 00,30 * * * *', "m30");
    start('00 00 * * * *', "h1");
    start('00 00 00,06,12,18 * * *', "h6");
    start('00 00 00,12 * * *', "h12");
    start('00 00 00 * * *', "d1");
    new CronJob({
      cronTime: '00 00 00 * * *',
      onTick: async () => {
        let db = await DB;
        await db.collection("users").update({}, { $set: { point: 0 } }, { multi: true });
      },
      start: false,
      timeZone: 'Asia/Tokyo'
    }).start();
  }

  static create(sn: string, pass: string): User {
    if (!pass.match(Config.user.pass.regex)) {
      throw new AtError(StatusCode.MisdirectedRequest, Config.user.pass.msg);
    }

    if (!sn.toString().match(Config.user.sn.regex)) {
      throw new AtError(StatusCode.MisdirectedRequest, Config.user.sn.msg);
    }
    let now = new Date();
    return new User(new ObjectID(),
      sn,
      StringUtil.hashLong(pass + Config.salt.pass),
      1,
      { last: now, m10: 0, m30: 0, h1: 0, h6: 0, h12: 0, d1: 0 },
      now,
      now,
      0);
  }

  changePass(_authUser: IAuthUser, pass: string) {
    if (!pass.match(Config.user.pass.regex)) {
      throw new AtError(StatusCode.MisdirectedRequest, Config.user.pass.msg);
    }

    this._pass = StringUtil.hashLong(pass + Config.salt.pass);
  }

  auth(pass: String): IAuthUser {
    if (this._pass === StringUtil.hashLong(pass + Config.salt.pass)) {
      return { id: this._id, pass: this._pass };
    } else {
      throw new AtError(StatusCode.Unauthorized, "認証に失敗しました");
    }
  }

  usePoint(val: number) {
    if (this._lv < this._point + val) {
      throw new AtError(StatusCode.Forbidden, "ポイントが足りません");
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
      throw new AtError(StatusCode.Forbidden, "連続書き込みはできません");
    }
  }
  changeLastTopic(lastTopic: Date) {
    if (this._lastTopic.getTime() + 1000 * 60 * 30 < lastTopic.getTime()) {
      this._lastTopic = lastTopic;
    } else {
      throw new AtError(StatusCode.Forbidden, "連続書き込みはできません");
    }

  }
}