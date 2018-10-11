import { Option } from "fp-ts/lib/Option";
import { ObjectID } from "mongodb";
import { AtRightError, paramsErrorMaker } from "../../at-error";
import { IAuthToken } from "../../auth";
import { Config } from "../../config";
import { IGenerator } from "../../generator";
import { Copyable } from "../../utils";

export interface IProfileDB {
  readonly _id: ObjectID;
  readonly user: ObjectID;
  readonly name: string;
  readonly text: string;
  readonly date: Date;
  readonly update: Date;
  readonly sn: string;
}

export interface IProfileAPI {
  readonly id: string;
  readonly self: boolean | null;
  readonly name: string;
  readonly text: string;
  readonly date: string;
  readonly update: string;
  readonly sn: string;
}

export class Profile extends Copyable<Profile> {
  static fromDB(p: IProfileDB): Profile {
    return new Profile(p._id.toString(), p.user.toString(), p.name, p.text, p.date, p.update, p.sn);
  }

  static create(
    objidGenerator: IGenerator<string>,
    authToken: IAuthToken,
    name: string,
    text: string,
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
        field: "text",
        val: text,
        regex: Config.user.profile.text.regex,
        message: Config.user.profile.text.msg,
      },
      {
        field: "sn",
        val: sn,
        regex: Config.user.profile.sn.regex,
        message: Config.user.profile.sn.msg,
      },
    ]);

    return new Profile(objidGenerator(),
      authToken.user,
      name,
      text,
      now,
      now,
      sn);
  }

  constructor(
    readonly id: string,
    readonly user: string,
    readonly name: string,
    readonly text: string,
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
      text: this.text,
      date: this.date,
      update: this.update,
      sn: this.sn,
    };
  }

  toAPI(authToken: Option<IAuthToken>): IProfileAPI {
    return {
      id: this.id,
      self: authToken.map(authToken => authToken.user === this.user).toNullable(),
      name: this.name,
      text: this.text,
      date: this.date.toISOString(),
      update: this.update.toISOString(),
      sn: this.sn,
    };
  }

  changeData(
    authToken: IAuthToken,
    name: string | undefined,
    text: string | undefined,
    sn: string | undefined,
    now: Date) {
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
        field: "text",
        val: text,
        regex: Config.user.profile.text.regex,
        message: Config.user.profile.text.msg,
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
      text,
      sn,
      update: now,
    });
  }
}
