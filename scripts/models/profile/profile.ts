import { ObjectID } from 'mongodb';
import { IAuthToken } from '../../auth';
import { AtRightError, paramsErrorMaker } from '../../at-error'
import { Config } from '../../config';
import { IGenerator } from '../../generator';

export interface IProfileDB {
  _id: ObjectID,
  user: ObjectID,
  name: string,
  body: string,
  date: Date,
  update: Date,
  sn: string
}

export interface IProfileAPI {
  id: string,
  user: string | null,
  name: string,
  body: string,
  date: string,
  update: string,
  sn: string
}

export class Profile {
  private constructor(private _id: ObjectID,
    private _user: ObjectID,
    private _name: string,
    private _body: string,
    private _date: Date,
    private _update: Date,
    private _sn: string) {

  }

  get id() {
    return this._id;
  }

  get user() {
    return this._user;
  }

  get name() {
    return this._name;
  }

  get body() {
    return this._body;
  }

  get date() {
    return this._date;
  }

  get update() {
    return this._update;
  }

  get sn() {
    return this._sn;
  }

  toDB(): IProfileDB {
    return {
      _id: this._id,
      user: this._user,
      name: this._name,
      body: this._body,
      date: this._date,
      update: this._update,
      sn: this._sn
    };
  }

  toAPI(authToken: IAuthToken | null): IProfileAPI {
    return {
      id: this._id.toString(),
      user: authToken !== null && authToken.user.equals(this._user) ? this._user.toString() : null,
      name: this._name,
      body: this._body,
      date: this._date.toISOString(),
      update: this._update.toISOString(),
      sn: this._sn
    }
  }

  static fromDB(p: IProfileDB): Profile {
    return new Profile(p._id, p.user, p.name, p.body, p.date, p.update, p.sn);
  }

  static create(objidGenerator: IGenerator<ObjectID>, authToken: IAuthToken, name: string, body: string, sn: string, now: Date): Profile {
    paramsErrorMaker([
      {
        field: "name",
        val: name,
        regex: Config.user.profile.name.regex,
        message: Config.user.profile.name.msg
      },
      {
        field: "body",
        val: body,
        regex: Config.user.profile.body.regex,
        message: Config.user.profile.body.msg
      },
      {
        field: "sn",
        val: sn,
        regex: Config.user.profile.sn.regex,
        message: Config.user.profile.sn.msg
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

  changeData(authToken: IAuthToken, name: string, body: string, sn: string, now: Date) {
    if (!authToken.user.equals(this._user)) {
      throw new AtRightError("人のプロフィール変更は出来ません");
    }
    paramsErrorMaker([
      {
        field: "name",
        val: name,
        regex: Config.user.profile.name.regex,
        message: Config.user.profile.name.msg
      },
      {
        field: "body",
        val: body,
        regex: Config.user.profile.body.regex,
        message: Config.user.profile.body.msg
      },
      {
        field: "sn",
        val: sn,
        regex: Config.user.profile.sn.regex,
        message: Config.user.profile.sn.msg
      },
    ]);

    this._name = name;
    this._body = body;
    this._sn = sn;
    this._update = now;
  }
}