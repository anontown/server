import { Option } from "fp-ts/lib/Option";
import { ObjectID } from "mongodb";
import { AtRightError, paramsErrorMaker } from "../../at-error";
import { IAuthTokenMaster } from "../../auth";
import { Config } from "../../config";
import { IGenerator } from "../../generator";
import { Copyable } from "../../utils";

export interface IClientDB {
  readonly _id: ObjectID;
  readonly name: string;
  readonly url: string;
  readonly user: ObjectID;
  readonly date: Date;
  readonly update: Date;
}

export interface IClientAPI {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly self: boolean | null;
  readonly date: string;
  readonly update: string;
}

export class Client extends Copyable<Client> {

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

    return new Client(objidGenerator(),
      name,
      url,
      authToken.user,
      now,
      now);
  }

  constructor(
    readonly id: string,
    readonly name: string,
    readonly url: string,
    readonly user: string,
    readonly date: Date,
    readonly update: Date) {
    super(Client);
  }

  toDB(): IClientDB {
    return {
      _id: new ObjectID(this.id),
      name: this.name,
      url: this.url,
      user: new ObjectID(this.user),
      date: this.date,
      update: this.update,
    };
  }

  toAPI(authToken: Option<IAuthTokenMaster>): IClientAPI {
    return {
      id: this.id,
      name: this.name,
      url: this.url,
      self: authToken.map(authToken => authToken.user === this.user).toNullable(),
      date: this.date.toISOString(),
      update: this.update.toISOString(),
    };
  }

  changeData(authToken: IAuthTokenMaster, name: string | undefined, url: string | undefined, now: Date): Client {
    if (authToken.user !== this.user) {
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

    return this.copy({ name, url, update: now });
  }
}
