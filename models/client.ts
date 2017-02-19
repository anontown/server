import { IAuthUser } from '../auth'
import { Config } from '../config';
import { AtError, StatusCode } from '../at-error'
import { ObjectID } from 'mongodb';
import { DB } from '../db';

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

  static async findOne(id: ObjectID): Promise<Client> {
    let db = await DB;
    let client: IClientDB | null = await db.collection("clients")
      .findOne({ _id: id });

    if (client === null) {
      throw new AtError(StatusCode.NotFound, "クライアントが存在しません");
    }
    return this.fromDB(client);
  }

  static async findIn(ids: ObjectID[]): Promise<Client[]> {
    let db = await DB;
    let clients: IClientDB[] = await db.collection("clients")
      .find({ _id: { $in: ids } })
      .sort({ date: -1 })
      .toArray();

    if (clients.length !== ids.length) {
      throw new AtError(StatusCode.NotFound, "クライアントが存在しません");
    }

    return clients.map(c => this.fromDB(c));
  }

  static async findAll(authUser: IAuthUser): Promise<Client[]> {
    let db = await DB;
    let clients: IClientDB[] = await db.collection("clients")
      .find({ user: authUser.id })
      .sort({ date: -1 })
      .toArray();
    return clients.map(c => this.fromDB(c));
  }

  static async insert(client: Client): Promise<null> {
    let db = await DB;

    await db.collection("clients")
      .insert(client.toDB());

    return null;
  }

  static async update(client: Client): Promise<null> {
    let db = await DB;
    await db.collection("clients").update({ _id: client._id }, client.toDB());
    return null;
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

  static create(authUser: IAuthUser, name: string, url: string,now:Date): Client {
    if (!name.match(Config.user.client.name.regex)) {
      throw new AtError(StatusCode.MisdirectedRequest, Config.user.client.name.msg);
    }
    if (!url.match(Config.user.client.url.regex)) {
      throw new AtError(StatusCode.MisdirectedRequest, Config.user.client.url.msg);
    }

    return new Client(new ObjectID(),
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