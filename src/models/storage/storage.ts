import { ObjectID } from "mongodb";
import { IAuthToken } from "../../auth";
import { Config } from "../../config";
import { IGenerator } from "../../generator";
import Copyable from "ts-copyable";
import { AtRightError, paramsErrorMaker } from "../../at-error";

export interface IStorageDB {
  _id: ObjectID,
  client: ObjectID | null;
  user: ObjectID;
  key: string;
  value: string;
}

export type IStorageAPI = string;

export class Storage extends Copyable<Storage> {
  static fromDB(db: IStorageDB): Storage {
    return new Storage(db._id.toHexString(),
      db.client !== null ? db.client.toHexString() : null,
      db.user.toHexString(),
      db.key,
      db.value);
  }

  static create(
    objidGenerator: IGenerator<string>,
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

    return new Storage(objidGenerator(),
      authToken.type === "general" ? authToken.client : null,
      authToken.user,
      key,
      value);
  }

  constructor(
    readonly id: string,
    readonly client: string | null,
    readonly user: string,
    readonly key: string,
    readonly value: string) {
    super(Storage);
  }

  toDB(): IStorageDB {
    return {
      _id: new ObjectID(this.id),
      client: this.client !== null ? new ObjectID(this.client) : null,
      user: new ObjectID(this.user),
      key: this.key,
      value: this.value,
    };
  }

  private auth(authToken: IAuthToken) {
    if (!(authToken.user === this.user && ((authToken.type === "master" && this.client === null) ||
      authToken.type === "general" && authToken.client === this.client))) {
      throw new AtRightError("権限がありません");
    }
  }

  toAPI(authToken: IAuthToken): IStorageAPI {
    this.auth(authToken);
    return this.value;
  }

  changeData(authToken: IAuthToken, value: string): Storage {
    this.auth(authToken);
    paramsErrorMaker([
      {
        field: "value",
        val: value,
        regex: Config.user.storage.value.regex,
        message: Config.user.storage.value.msg,
      },
    ]);

    return this.copy({ value });
  }
}
