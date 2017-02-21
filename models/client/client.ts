import { IAuthUser } from '../../auth'
import { Config } from '../../config';
import { AtError, StatusCode } from '../../at-error'
import { ObjectID } from 'mongodb';
import { IGenerator } from '../../generator';

export interface IClientDB {
  _id: ObjectID,
  name: string,
  url: string,
  user: ObjectID,
  date: Date,
  update: Date
}

export interface IClientAPI {
  id: string,
  name: string,
  url: string,
  user: string | null
  date: string,
  update: string
}

export class Client {
  private constructor(private _id: ObjectID,
    private _name: string,
    private _url: string,
    private _user: ObjectID,
    private _date: Date,
    private _update: Date) {

  }

  get id(): ObjectID {
    return this._id;
  }

  toDB(): IClientDB {
    return {
      _id: this._id,
      name: this._name,
      url: this._url,
      user: this._user,
      date: this._date,
      update: this._update
    }
  }

  toAPI(authUser: IAuthUser | null): IClientAPI {
    return {
      id: this._id.toString(),
      name: this._name,
      url: this._url,
      user: (authUser !== null && authUser.id.equals(this._user) ? this._user.toString() : null),
      date: this._date.toISOString(),
      update: this._date.toISOString()
    };
  }

  static fromDB(c: IClientDB): Client {
    return new Client(c._id, c.name, c.url, c.user, c.date, c.update);
  }

  static create(objidGenerator:IGenerator<ObjectID>,authUser: IAuthUser, name: string, url: string,now:Date): Client {
    if (!name.match(Config.user.client.name.regex)) {
      throw new AtError(StatusCode.MisdirectedRequest, Config.user.client.name.msg);
    }
    if (!url.match(Config.user.client.url.regex)) {
      throw new AtError(StatusCode.MisdirectedRequest, Config.user.client.url.msg);
    }

    return new Client(objidGenerator.get(),
      name,
      url,
      authUser.id,
      now,
      now);
  }

  changeData(authUser: IAuthUser, name: string, url: string,now:Date) {
    if (!authUser.id.equals(this._user)) {
      throw new AtError(StatusCode.MisdirectedRequest, "人のクライアント変更は出来ません");
    }
    if (!name.match(Config.user.client.name.regex)) {
      throw new AtError(StatusCode.MisdirectedRequest, Config.user.client.name.msg);
    }
    if (!url.match(Config.user.client.url.regex)) {
      throw new AtError(StatusCode.MisdirectedRequest, Config.user.client.url.msg);
    }

    this._name = name;
    this._url = url;
    this._update =now;
  }
}