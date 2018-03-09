import { ObjectID } from "mongodb";
import Copyable from "ts-copyable";
import { AtPrerequisiteError, AtUserAuthError, paramsErrorMaker } from "../../at-error";
import { IAuthUser } from "../../auth";
import { Config } from "../../config";
import { IGenerator } from "../../generator";
import { hash } from "../../utils";
import { StringOmit } from "typelevel-ts";

export interface IUserDB {
  readonly _id: ObjectID;
  readonly sn: string;
  readonly pass: string;
  readonly lv: number;
  readonly resWait: IResWait;
  readonly lastTopic: Date;
  readonly date: Date;
  readonly point: number;
  readonly lastOneTopic: Date;
}

export type ResWaitCountKey = StringOmit<keyof IResWait, "last">;

export interface IUserAPI {
  readonly id: string;
  readonly sn: string;
}

export interface IResWait {
  readonly last: Date;
  readonly m10: number;
  readonly m30: number;
  readonly h1: number;
  readonly h6: number;
  readonly h12: number;
  readonly d1: number;
}

export class User extends Copyable<User> {
  static fromDB(u: IUserDB): User {
    return new User(u._id.toString(), u.sn, u.pass, u.lv, u.resWait, u.lastTopic, u.date, u.point, u.lastOneTopic);
  }

  static create(objidGenerator: IGenerator<string>, sn: string, pass: string, now: Date): User {
    paramsErrorMaker([
      {
        field: "pass",
        val: pass,
        regex: Config.user.pass.regex,
        message: Config.user.pass.msg,
      },
      {
        field: "sn",
        val: sn,
        regex: Config.user.sn.regex,
        message: Config.user.sn.msg,
      },
    ]);

    return new User(objidGenerator(),
      sn,
      hash(pass + Config.salt.pass),
      1,
      { last: now, m10: 0, m30: 0, h1: 0, h6: 0, h12: 0, d1: 0 },
      now,
      now,
      0,
      now);
  }

  constructor(
    readonly id: string,
    readonly sn: string,
    readonly pass: string,
    readonly lv: number,
    readonly resWait: IResWait,
    readonly lastTopic: Date,
    readonly date: Date,
    // 毎日リセットされ、特殊動作をすると増えるポイント
    readonly point: number,
    readonly lastOneTopic: Date) {
    super(User);
  }

  toDB(): IUserDB {
    return {
      _id: new ObjectID(this.id),
      sn: this.sn,
      pass: this.pass,
      lv: this.lv,
      resWait: this.resWait,
      lastTopic: this.lastTopic,
      date: this.date,
      point: this.point,
      lastOneTopic: this.lastOneTopic,
    };
  }

  toAPI(): IUserAPI {
    return {
      id: this.id,
      sn: this.sn,
    };
  }

  change(_authUser: IAuthUser, pass: string, sn: string): User {
    paramsErrorMaker([
      {
        field: "pass",
        val: pass,
        regex: Config.user.pass.regex,
        message: Config.user.pass.msg,
      },
      {
        field: "sn",
        val: sn,
        regex: Config.user.sn.regex,
        message: Config.user.sn.msg,
      },
    ]);

    return this.copy({ pass: hash(pass + Config.salt.pass), sn });
  }

  auth(pass: string): IAuthUser {
    if (this.pass === hash(pass + Config.salt.pass)) {
      return { id: this.id, pass: this.pass };
    } else {
      throw new AtUserAuthError();
    }
  }

  usePoint(val: number): User {
    if (this.lv < this.point + val) {
      throw new AtPrerequisiteError("LVが足りません");
    }
    return this.copy({ point: this.point + val });
  }

  changeLv(lv: number): User {
    return this.copy({
      lv: lv < 1 ? 1
        : lv > Config.user.lvMax ? Config.user.lvMax
          : lv,
    });
  }

  changeLastRes(lastRes: Date): User {
    // 条件
    // 係数
    // Config.user.lvMaxの時、Config.res.wait.maxLv倍緩和
    const coe = (this.lv / Config.user.lvMax) * (Config.res.wait.maxLv - 1) + 1;
    if (
      this.resWait.d1 < Config.res.wait.d1 * coe &&
      this.resWait.h12 < Config.res.wait.h12 * coe &&
      this.resWait.h6 < Config.res.wait.h6 * coe &&
      this.resWait.h1 < Config.res.wait.h1 * coe &&
      this.resWait.m30 < Config.res.wait.m30 * coe &&
      this.resWait.m10 < Config.res.wait.m10 * coe &&
      this.resWait.last.getTime() + 1000 * Config.res.wait.minSecond < lastRes.getTime()
    ) {
      return this.copy({
        resWait: {
          d1: this.resWait.d1 + 1,
          h12: this.resWait.h12 + 1,
          h6: this.resWait.h6 + 1,
          h1: this.resWait.h1 + 1,
          m30: this.resWait.m30 + 1,
          m10: this.resWait.m10 + 1,
          last: lastRes,
        },
      });
    } else {
      throw new AtPrerequisiteError("連続書き込みはできません");
    }
  }
  changeLastTopic(lastTopic: Date): User {
    if (this.lastTopic.getTime() + 1000 * 60 * 30 < lastTopic.getTime()) {
      return this.copy({ lastTopic });
    } else {
      throw new AtPrerequisiteError("連続書き込みはできません");
    }
  }

  changeLastOneTopic(lastTopic: Date): User {
    if (this.lastOneTopic.getTime() + 1000 * 60 * 10 < lastTopic.getTime()) {
      return this.copy({ lastOneTopic: lastTopic });
    } else {
      throw new AtPrerequisiteError("連続書き込みはできません");
    }
  }
}
