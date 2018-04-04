import { CronJob } from "cron";
import { AtConflictError, AtNotFoundError } from "../../at-error";
import { Logger } from "../../logger";
import { IUserRepo } from "./iuser-repo";
import { IUserDB, ResWaitCountKey, User } from "./user";

export class UserRepoMock implements IUserRepo {
  private users: IUserDB[] = [];

  async findOne(id: string): Promise<User> {
    const user = this.users.find(x => x._id.toHexString() === id);

    if (user === undefined) {
      throw new AtNotFoundError("ユーザーが存在しません");
    }

    return User.fromDB(user);
  }

  async findID(sn: string): Promise<string> {
    const user = this.users.find(x => x.sn === sn);

    if (user === undefined) {
      throw new AtNotFoundError("ユーザーが存在しません");
    }

    return user._id.toHexString();
  }

  async insert(user: User): Promise<void> {
    if (this.users.findIndex(x => x.sn === user.sn) !== -1) {
      throw new AtConflictError("スクリーンネームが使われています");
    }

    this.users.push(user.toDB());
  }

  async update(user: User): Promise<void> {
    if (this.users.findIndex(x => x.sn === user.sn && x._id.toHexString() !== user.id) !== -1) {
      throw new AtConflictError("スクリーンネームが使われています");
    }

    this.users[this.users.findIndex(x => x._id.toHexString() === user.id)] = user.toDB();
  }

  async cronPointReset(): Promise<void> {
    this.users = this.users.map(x => ({ ...x, point: 0 }));
  }

  async cronCountReset(key: ResWaitCountKey): Promise<void> {
    this.users = this.users.map(x => ({ ...x, resWait: { ...x.resWait, [key]: 0 } }));
  }

  cron() {
    const start = (cronTime: string, key: ResWaitCountKey) => {
      new CronJob({
        cronTime,
        onTick: async () => {
          Logger.system.info("UserCron", key);
          await this.cronCountReset(key);
        },
        start: false,
        timeZone: "Asia/Tokyo",
      }).start();
    };

    start("00 00,10,20,30,40,50 * * * *", "m10");
    start("00 00,30 * * * *", "m30");
    start("00 00 * * * *", "h1");
    start("00 00 00,06,12,18 * * *", "h6");
    start("00 00 00,12 * * *", "h12");
    start("00 00 00 * * *", "d1");
    new CronJob({
      cronTime: "00 00 00 * * *",
      onTick: async () => {
        await this.cronPointReset();
      },
      start: false,
      timeZone: "Asia/Tokyo",
    }).start();
  }
}
