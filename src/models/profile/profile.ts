import { ObjectID } from "mongodb";
import Copyable from "ts-copyable";
import { AtRightError, paramsErrorMaker } from "../../at-error";
import { IAuthToken } from "../../auth";
import { Config } from "../../config";
import { IGenerator } from "../../generator";

export interface IProfileDB {
  readonly _id: ObjectID;
  readonly user: ObjectID;
  readonly name: string;
  readonly body: string;
  readonly date: Date;
  readonly update: Date;
  readonly sn: string;
}

export interface IProfileAPI {
  readonly id: string;
  readonly user: string | null;
  readonly name: string;
  readonly body: string;
  readonly date: string;
  readonly update: string;
  readonly sn: string;
}

export class Profile extends Copyable<Profile> {
  static fromDB(p: IProfileDB): Profile {
    return new Profile(p._id.toString(), p.user.toString(), p.name, p.body, p.date, p.update, p.sn);
  }

  static create(
    objidGenerator: IGenerator<string>,
    authToken: IAuthToken,
    name: string,
    body: string,
    sn: string,
    now: Date): Profile {
    paramsErrorMaker([
      {
        field: "name",
        val: name,
        regex: Config.user.profile.name.regex,
        message: Config.user.profile.name.msg,
      },
      {
        field: "body",
        val: body,
        regex: Config.user.profile.body.regex,
        message: Config.user.profile.body.msg,
      },
      {
        field: "sn",
        val: sn,
        regex: Config.user.profile.sn.regex,
        message: Config.user.profile.sn.msg,
      },
    ]);

    return new Profile(objidGenerator.get(),
      authToken.user,
      name,
      body,
      now,
      now,
      sn);
  }

  constructor(
    readonly id: string,
    readonly user: string,
    readonly name: string,
    readonly body: string,
    readonly date: Date,
    readonly update: Date,
    readonly sn: string) {
    super(Profile);
  }

  toDB(): IProfileDB {
    return {
      _id: new ObjectID(this.id),
      user: new ObjectID(this.user),
      name: this.name,
      body: this.body,
      date: this.date,
      update: this.update,
      sn: this.sn,
    };
  }

  toAPI(authToken: IAuthToken | null): IProfileAPI {
    return {
      id: this.id,
      user: authToken !== null && authToken.user === this.user ? this.user : null,
      name: this.name,
      body: this.body,
      date: this.date.toISOString(),
      update: this.update.toISOString(),
      sn: this.sn,
    };
  }

  changeData(authToken: IAuthToken, name: string, body: string, sn: string, now: Date) {
    if (authToken.user !== this.user) {
      throw new AtRightError("人のプロフィール変更は出来ません");
    }
    paramsErrorMaker([
      {
        field: "name",
        val: name,
        regex: Config.user.profile.name.regex,
        message: Config.user.profile.name.msg,
      },
      {
        field: "body",
        val: body,
        regex: Config.user.profile.body.regex,
        message: Config.user.profile.body.msg,
      },
      {
        field: "sn",
        val: sn,
        regex: Config.user.profile.sn.regex,
        message: Config.user.profile.sn.msg,
      },
    ]);

    return this.copy({
      name,
      body,
      sn,
      update: now,
    });
  }
}
