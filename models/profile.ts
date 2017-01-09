import { ObjectID } from 'mongodb';
import { StringUtil } from '../util';
import { DB } from '../db';
import { IAuthToken } from '../auth';
import { AtError, StatusCode } from '../at-error'
import { Config } from '../config';


export interface IProfileDB {
  _id: ObjectID,
  user: ObjectID,
  name: string,
  text: string,
  mdtext: string,
  date: Date,
  update: Date
}

export interface IProfileAPI {
  id: string,
  user: string | null,
  name: string,
  text: string,
  mdtext: string,
  date: string,
  update: string
}

export class Profile {
  private constructor(private _id: ObjectID,
    private _user: ObjectID,
    private _name: string,
    private _text: string,
    private _mdtext: string,
    private _date: Date,
    private _update: Date) {

  }

  static async findOne(id: ObjectID): Promise<Profile> {
    let db = await DB;
    let profile: IProfileDB | null = await db.collection("profiles")
      .findOne({ _id: id });

    if (profile === null) {
      throw new AtError(StatusCode.NotFound, "プロフィールが存在しません");
    }

    return this.fromDB(profile);
  }

  static async findIn(ids: ObjectID[]): Promise<Profile[]> {
    let db = await DB;
    let profiles: IProfileDB[] = await db.collection("profiles")
      .find({ _id: { $in: ids } })
      .sort({ date: -1 })
      .toArray();

    if (profiles.length !== ids.length) {
      throw new AtError(StatusCode.NotFound, "プロフィールが存在しません");
    }

    return profiles.map(p => this.fromDB(p));
  }

  static async findAll(authToken: IAuthToken): Promise<Profile[]> {
    let db = await DB;
    let profiles: IProfileDB[] = await db.collection("profiles")
      .find({ user: authToken.user })
      .sort({ date: -1 })
      .toArray();
    return profiles.map(p => this.fromDB(p));
  }

  static async insert(profile: Profile): Promise<null> {
    let db = await DB;
    await db.collection("profiles").insert(profile.toDB());
    return null;
  }

  static async update(profile: Profile): Promise<null> {
    let db = await DB;
    await db.collection("profiles").update({ _id: profile._id }, profile.toDB());
    return null;
  }

  toDB(): IProfileDB {
    return {
      _id: this._id,
      user: this._user,
      name: this._name,
      text: this._text,
      mdtext: this._mdtext,
      date: this._date,
      update: this._update
    };
  }

  toAPI(authToken: IAuthToken | null): IProfileAPI {
    return {
      id: this._id.toString(),
      user: authToken !== null && authToken.user.equals(this._user) ? this._user.toString() : null,
      name: this._name,
      text: this._text,
      mdtext: this._text,
      date: this._date.toISOString(),
      update: this._update.toISOString()
    }
  }

  static fromDB(p: IProfileDB): Profile {
    return new Profile(p._id, p.user, p.name, p.text, p.mdtext, p.date, p.update);
  }

  get id(): ObjectID {
    return this._id;
  }

  get user(): ObjectID {
    return this._user;
  }

  static create(authToken: IAuthToken, name: string, text: string): Profile {
    if (!name.match(Config.user.profile.name.regex)) {
      throw new AtError(StatusCode.MisdirectedRequest, Config.user.profile.name.msg);
    }
    if (!text.match(Config.user.profile.text.regex)) {
      throw new AtError(StatusCode.MisdirectedRequest, Config.user.profile.text.msg);
    }

    let now = new Date();
    return new Profile(new ObjectID(),
      authToken.user,
      name,
      text,
      StringUtil.md(text),
      now,
      now);
  }

  changeData(authToken: IAuthToken, name: string, text: string) {
    if (!authToken.user.equals(this._user)) {
      throw new AtError(StatusCode.MisdirectedRequest, "人のプロフィール変更は出来ません");
    }
    if (!name.match(Config.user.profile.name.regex)) {
      throw new AtError(StatusCode.MisdirectedRequest, Config.user.profile.name.msg);
    }
    if (!text.match(Config.user.profile.text.regex)) {
      throw new AtError(StatusCode.MisdirectedRequest, Config.user.profile.text.msg);
    }

    this._name = name;
    this._text = text;
    this._mdtext = StringUtil.md(text);
    this._update = new Date();
  }
}