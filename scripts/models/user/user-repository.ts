import { ObjectID, WriteError } from 'mongodb';
import { DB } from '../../db';
import { AtNotFoundError, AtConflictError } from '../../at-error'
import { User, IUserDB } from './user';
import { CronJob } from 'cron';


export class UserRepository {
  static async findOne(id: string): Promise<User> {
    let db = await DB;
    let user: IUserDB | null = await db.collection("users").findOne({ _id: new ObjectID(id) });

    if (user === null) {
      throw new AtNotFoundError("ユーザーが存在しません");
    }

    return User.fromDB(user);
  }

  static async findID(sn: string): Promise<ObjectID> {
    let db = await DB;
    let user: IUserDB | null = await db.collection("users").findOne({ sn });

    if (user === null) {
      throw new AtNotFoundError("ユーザーが存在しません");
    }

    return user._id;
  }
  static async findSN(id: string): Promise<string> {
    let db = await DB;
    let user: IUserDB | null = await db.collection("users").findOne({ _id: new ObjectID(id) });

    if (user === null) {
      throw new AtNotFoundError("ユーザーが存在しません");
    }

    return user.sn;
  }
  static async insert(user: User): Promise<null> {
    let db = await DB;
    await db.collection("users").insert(user.toDB()).catch((e: WriteError) => {
      if (e.code === 11000) {
        throw new AtConflictError("スクリーンネームが使われています");
      } else {
        throw e;
      }
    });
    return null;
  }

  static async update(user: User): Promise<null> {
    let db = await DB;
    await db.collection("users").update({ _id: new ObjectID(user.id) }, user.toDB()).catch((e: WriteError) => {
      if (e.code === 11000) {
        throw new AtConflictError("スクリーンネームが使われています");
      } else {
        throw e;
      }
    });
    return null;
  }

  static cron() {
    let start = (cronTime: string, field: string) => {
      new CronJob({
        cronTime,
        onTick: async () => {
          console.log("UserCron", field);
          let db = await DB;
          await db.collection("users").update({}, { $set: { ["resWait." + field]: 0 } }, { multi: true });
        },
        start: false,
        timeZone: 'Asia/Tokyo'
      }).start();
    }

    start('00 00,10,20,30,40,50 * * * *', "m10");
    start('00 00,30 * * * *', "m30");
    start('00 00 * * * *', "h1");
    start('00 00 00,06,12,18 * * *', "h6");
    start('00 00 00,12 * * *', "h12");
    start('00 00 00 * * *', "d1");
    new CronJob({
      cronTime: '00 00 00 * * *',
      onTick: async () => {
        let db = await DB;
        await db.collection("users").update({}, { $set: { point: 0 } }, { multi: true });
      },
      start: false,
      timeZone: 'Asia/Tokyo'
    }).start();
  }
}