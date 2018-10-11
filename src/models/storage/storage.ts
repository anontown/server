import { fromNullable, none, Option, some } from "fp-ts/lib/Option";
import { ObjectID } from "mongodb";
import { AtRightError, paramsErrorMaker } from "../../at-error";
import { IAuthToken } from "../../auth";
import { Config } from "../../config";
import { Copyable } from "../../utils";

export interface IStorageDB {
  client: ObjectID | null;
  user: ObjectID;
  key: string;
  value: string;
}

export type IStorageAPI = string;

export class Storage extends Copyable<Storage> {
  static fromDB(db: IStorageDB): Storage {
    return new Storage(fromNullable(db.client).map(client => client.toHexString()),
      db.user.toHexString(),
      db.key,
      db.value);
  }

  static create(
    authToken: IAuthToken,
    key: string,
    value: string): Storage {
    paramsErrorMaker([
      {
        field: "key",
        val: key,
        regex: Config.user.storage.key.regex,
        message: Config.user.storage.key.msg,
      },
      {
        field: "value",
        val: value,
        regex: Config.user.storage.value.regex,
        message: Config.user.storage.value.msg,
      },
    ]);

    return new Storage(authToken.type === "general" ? some(authToken.client) : none,
      authToken.user,
      key,
      value);
  }

  constructor(
    readonly client: Option<string>,
    readonly user: string,
    readonly key: string,
    readonly value: string) {
    super(Storage);
  }

  toDB(): IStorageDB {
    return {
      client: this.client.map(client => new ObjectID(client)).toNullable(),
      user: new ObjectID(this.user),
      key: this.key,
      value: this.value,
    };
  }

  toAPI(authToken: IAuthToken): IStorageAPI {
    if (authToken.user !== this.user ||
      (authToken.type === "master" ? null : authToken.client) !== this.client.toNullable()) {
      throw new AtRightError("権限がありません");
    }

    return this.value;
  }
}
