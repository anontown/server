import { CronJob } from "cron";
import { ObjectID, WriteError } from "mongodb";
import { AtConflictError, AtNotFoundError } from "../../at-error";
import { DB } from "../../db";
import { Logger } from "../../logger";
import { IUserRepo } from "./iuser-repo";
import { IUserDB, ResWaitCountKey, User } from "./user";

export class UserRepo implements IUserRepo {
  async findOne(id: string): Promise<User> {
    const db = await DB;
    const user: IUserDB | null = await db.collection("users").findOne({ _id: new ObjectID(id) });

    if (user === null) {
      throw new AtNotFoundError("ユーザーが存在しません");
    }

    return User.fromDB(user);
  }

  async findID(sn: string): Promise<string> {
    const db = await DB;
    const user: IUserDB | null = await db.collection("users").findOne({ sn });

    if (user === null) {
      throw new AtNotFoundError("ユーザーが存在しません");
    }

    return user._id.toHexString();
  }

  async insert(user: User): Promise<void> {
    const db = await DB;
    await db.collection("users").insert(user.toDB()).catch((e: WriteError) => {
      if (e.code === 11000) {
        throw new AtConflictError("スクリーンネームが使われています");
      } else {
        throw e;
      }
    });
  }

  async update(user: User): Promise<void> {
    const db = await DB;
    await db.collection("users").update({ _id: new ObjectID(user.id) }, user.toDB()).catch((e: WriteError) => {
      if (e.code === 11000) {
        throw new AtConflictError("スクリーンネームが使われています");
      } else {
        throw e;
      }
    });
  }

  async cronPointReset(): Promise<void> {
    const db = await DB;
    await db.collection("users").update({}, { $set: { point: 0 } }, { multi: true });
  }

  async cronCountReset(key: ResWaitCountKey): Promise<void> {
    const db = await DB;
    await db.collection("users").update({}, { $set: { ["resWait." + key]: 0 } }, { multi: true });
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
