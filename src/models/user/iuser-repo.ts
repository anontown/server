import { ResWaitCountKey, User } from "./user";

export interface IUserRepo {
  findOne(id: string): Promise<User>;

  findID(sn: string): Promise<string>;
  insert(user: User): Promise<void>;

  update(user: User): Promise<void>;

  cron(): void;

  cronPointReset(): Promise<void>;

  cronCountReset(key: ResWaitCountKey): Promise<void>;
}
