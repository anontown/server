import { ObjectID } from "mongodb";
import { AtRightError, paramsErrorMaker } from "../../at-error";
import { IAuthTokenMaster } from "../../auth";
import { Config } from "../../config";
import { IGenerator } from "../../generator";

export interface IClientDB {
  _id: ObjectID;
  name: string;
  url: string;
  user: ObjectID;
  date: Date;
  update: Date;
}

export interface IClientAPI {
  id: string;
  name: string;
  url: string;
  user: string | null;
  date: string;
  update: string;
}

export class Client {

  static fromDB(c: IClientDB): Client {
    return new Client(c._id.toString(), c.name, c.url, c.user.toString(), c.date, c.update);
  }

  static create(
    objidGenerator: IGenerator<string>,
    authToken: IAuthTokenMaster,
    name: string,
    url: string,
    now: Date): Client {
    paramsErrorMaker([
      {
        field: "name",
        val: name,
        regex: Config.user.client.name.regex,
        message: Config.user.client.name.msg,
      },
      {
        field: "url",
        val: url,
        regex: Config.user.client.url.regex,
        message: Config.user.client.url.msg,
      },
    ]);

    return new Client(objidGenerator.get(),
      name,
      url,
      authToken.user,
      now,
      now);
  }

  private constructor(
    private _id: string,
    private _name: string,
    private _url: string,
    private _user: string,
    private _date: Date,
    private _update: Date) {

  }

  get id() {
    return this._id;
  }

  get name() {
    return this._name;
  }

  get url() {
    return this._url;
  }

  get user() {
    return this._user;
  }

  get date() {
    return this._date;
  }

  get update() {
    return this._update;
  }

  toDB(): IClientDB {
    return {
      _id: new ObjectID(this._id),
      name: this._name,
      url: this._url,
      user: new ObjectID(this._user),
      date: this._date,
      update: this._update,
    };
  }

  toAPI(authToken: IAuthTokenMaster | null): IClientAPI {
    return {
      id: this._id,
      name: this._name,
      url: this._url,
      user: authToken !== null && authToken.user === this._user ? this._user : null,
      date: this._date.toISOString(),
      update: this._date.toISOString(),
    };
  }

  changeData(authToken: IAuthTokenMaster, name: string, url: string, now: Date) {
    if (authToken.user !== this._user) {
      throw new AtRightError("人のクライアント変更は出来ません");
    }
    paramsErrorMaker([
      {
        field: "name",
        val: name,
        regex: Config.user.client.name.regex,
        message: Config.user.client.name.msg,
      },
      {
        field: "url",
        val: url,
        regex: Config.user.client.url.regex,
        message: Config.user.client.url.msg,
      },
    ]);

    this._name = name;
    this._url = url;
    this._update = now;
  }
}
