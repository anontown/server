import { ObjectID } from "mongodb";
import { User, ResWaitCountKey } from "./user";

export interface IUserRepo {
  findOne(id: string): Promise<User>;

  findID(sn: string): Promise<ObjectID>;
  insert(user: User): Promise<null>;

  update(user: User): Promise<null>;

  cron(): void;

  cronPointReset(): Promise<void>;

  cronCountReset(key: ResWaitCountKey): Promise<void>;
}
