import { ObjectID } from 'mongodb';
import { User } from '../user';
import { Res } from '../res';
import { History } from '../history';
import { IAuthToken } from '../../auth';
import { AtPrerequisiteError, paramsErrorMaker, paramsErrorMakerData } from '../../at-error'
import { Config } from '../../config';
import { StringUtil } from '../../util';
import { IGenerator } from '../../generator';

export type ITopicDB = ITopicNormalDB | ITopicOneDB | ITopicForkDB;

export interface ITopicNormalDB {
  _id: ObjectID,
  title: string,
  tags: string[],
  text: string,
  mdtext: string,
  update: Date,
  date: Date,
  type: 'normal',
  ageUpdate: Date,
  active: boolean
}

export interface ITopicOneDB {
  _id: ObjectID,
  title: string,
  tags: string[],
  text: string,
  mdtext: string,
  update: Date,
  date: Date,
  type: 'one',
  ageUpdate: Date,
  active: boolean
}

export interface ITopicForkDB {
  _id: ObjectID,
  title: string,
  update: Date,
  date: Date,
  type: 'fork',
  ageUpdate: Date,
  active: boolean,
  parent: ObjectID;
}

export type ITopicAPI = ITopicOneAPI | ITopicNormalAPI | ITopicForkAPI;

export interface ITopicNormalAPI {
  id: string,
  title: string,
  tags: string[],
  text: string,
  mdtext: string,
  update: string,
  date: string,
  resCount: number,
  type: 'normal',
  active: boolean
}

export interface ITopicOneAPI {
  id: string,
  title: string,
  tags: string[],
  text: string,
  mdtext: string,
  update: string,
  date: string,
  resCount: number,
  type: 'one',
  active: boolean
}

export interface ITopicForkAPI {
  id: string,
  title: string,
  update: string,
  date: string,
  resCount: number,
  type: 'fork',
  active: boolean,
  parent: string
}

export type TopicType = "one" | "normal" | "fork";

export type ITopic = ITopicNormal | ITopicOne | ITopicFork;

export interface ITopicNormal {
  id: ObjectID,
  title: string,
  tags: string[],
  text: string,
  mdtext: string,
  update: Date,
  date: Date,
  resCount: number,
  type: 'normal',
  ageUpdate: Date,
  active: boolean
}

export interface ITopicOne {
  id: ObjectID,
  title: string,
  tags: string[],
  text: string,
  mdtext: string,
  update: Date,
  date: Date,
  resCount: number,
  type: 'one',
  ageUpdate: Date,
  active: boolean
}

export interface ITopicFork {
  id: ObjectID,
  title: string,
  update: Date,
  date: Date,
  resCount: number,
  type: 'fork',
  ageUpdate: Date,
  active: boolean,
  parent: ObjectID,
}

export module Topic {
  export function toDB(topic: ITopicNormal): ITopicNormalDB;
  export function toDB(topic: ITopicOne): ITopicOneDB;
  export function toDB(topic: ITopicFork): ITopicForkDB;
  export function toDB(topic: ITopic): ITopicDB;
  export function toDB(topic: ITopic): ITopicDB {
    switch (topic.type) {
      case 'normal':
        return {
          _id: topic.id,
          title: topic.title,
          tags: topic.tags,
          text: topic.text,
          mdtext: topic.mdtext,
          update: topic.update,
          date: topic.date,
          type: topic.type,
          ageUpdate: topic.ageUpdate,
          active: topic.active
        };
      case 'one':
        return {
          _id: topic.id,
          title: topic.title,
          tags: topic.tags,
          text: topic.text,
          mdtext: topic.mdtext,
          update: topic.update,
          date: topic.date,
          type: topic.type,
          ageUpdate: topic.ageUpdate,
          active: topic.active
        };
      case 'fork':
        return {
          _id: topic.id,
          title: topic.title,
          update: topic.update,
          date: topic.date,
          type: topic.type,
          ageUpdate: topic.ageUpdate,
          active: topic.active,
          parent: topic.parent
        };
    }
  }

  export function toAPI(topic: ITopicNormal): ITopicNormalAPI;
  export function toAPI(topic: ITopicOne): ITopicOneAPI;
  export function toAPI(topic: ITopicFork): ITopicForkAPI;
  export function toAPI(topic: ITopic): ITopicAPI;
  export function toAPI(topic: ITopic): ITopicAPI {
    switch (topic.type) {
      case 'normal':
        return {
          id: topic.id.toString(),
          title: topic.title,
          tags: topic.tags,
          text: topic.text,
          mdtext: topic.mdtext,
          update: topic.update.toISOString(),
          date: topic.date.toISOString(),
          resCount: topic.resCount,
          type: topic.type,
          active: topic.active
        };
      case 'one':
        return {
          id: topic.id.toString(),
          title: topic.title,
          tags: topic.tags,
          text: topic.text,
          mdtext: topic.mdtext,
          update: topic.update.toISOString(),
          date: topic.date.toISOString(),
          resCount: topic.resCount,
          type: topic.type,
          active: topic.active
        };
      case 'fork':
        return {
          id: topic.id.toString(),
          title: topic.title,
          update: topic.update.toISOString(),
          date: topic.date.toISOString(),
          resCount: topic.resCount,
          type: topic.type,
          active: topic.active,
          parent: topic.parent.toString()
        };
    }
  }

  export function fromDB(db: ITopicNormalDB, resCount: number): ITopicNormal;
  export function fromDB(db: ITopicOneDB, resCount: number): ITopicOne;
  export function fromDB(db: ITopicForkDB, resCount: number): ITopicFork;
  export function fromDB(db: ITopicDB, resCount: number): ITopic;
  export function fromDB(db: ITopicDB, resCount: number): ITopic {
    switch (db.type) {
      case 'normal':
        return {
          id: db._id,
          title: db.title,
          tags: db.tags,
          text: db.text,
          mdtext: db.mdtext,
          update: db.update,
          date: db.date,
          resCount: resCount,
          type: db.type,
          ageUpdate: db.ageUpdate,
          active: db.active
        };
      case 'one':
        return {
          id: db._id,
          title: db.title,
          tags: db.tags,
          text: db.text,
          mdtext: db.mdtext,
          update: db.update,
          date: db.date,
          resCount: resCount,
          type: db.type,
          ageUpdate: db.ageUpdate,
          active: db.active
        };
      case 'fork':
        return {
          id: db._id,
          title: db.title,
          update: db.update,
          date: db.date,
          resCount: resCount,
          type: db.type,
          ageUpdate: db.ageUpdate,
          active: db.active,
          parent: db.parent
        };
    }
  }

  export function resUpdate(topic: ITopic, res: Res) {
    if (!topic.active) {
      throw new AtPrerequisiteError("トピックが落ちているので書き込めません")
    }

    topic.update = res.date;
    if (res.age) {
      topic.ageUpdate = res.date;
    }
  }

  export function createNormal(objidGenerator: IGenerator<ObjectID>, title: string, tags: string[], text: string, user: User, authToken: IAuthToken, now: Date): { topic: ITopicNormal, res: Res, history: History } {
    checkData({ title, tags, text });
    let topic: ITopicNormal = {
      id: objidGenerator.get(),
      title: title,
      tags: tags,
      text: text,
      mdtext: StringUtil.md(text),
      update: now,
      date: now,
      resCount: 1,
      type: 'normal',
      ageUpdate: now,
      active: true
    };
    let cd = changeData(topic, objidGenerator, user, authToken, title, tags, text, now);
    user.changeLastTopic(now);

    return { topic, history: cd.history, res: cd.res };
  }

  export function createOne(objidGenerator: IGenerator<ObjectID>, title: string, tags: string[], text: string, user: User, authToken: IAuthToken, now: Date): { topic: ITopicOne, res: Res } {
    checkData({ title, tags, text });
    let topic: ITopicOne = {
      id: objidGenerator.get(),
      title: title,
      tags: tags,
      text: text,
      mdtext: StringUtil.md(text),
      update: now,
      date: now,
      resCount: 1,
      type: 'one',
      ageUpdate: now,
      active: true
    };

    let res = Res.create(objidGenerator, topic, user, authToken, "", "トピ主", text, null, null, true, now);
    user.changeLastOneTopic(now);

    return { topic, res };
  }

  export function createFork(objidGenerator: IGenerator<ObjectID>, title: string, parent: ITopicNormal, user: User, authToken: IAuthToken, now: Date): { topic: ITopicFork, res: Res, resParent: Res } {
    checkData({ title });
    let topic: ITopicFork = {
      id: objidGenerator.get(),
      title: title,
      update: now,
      date: now,
      resCount: 1,
      type: 'fork',
      ageUpdate: now,
      active: true,
      parent: parent.id
    };

    let res = Res.create(objidGenerator, topic, user, authToken, "", "トピ主", "トピックが建ちました", null, null, true, now);
    //エスケープすること
    let resParent = Res.create(objidGenerator, parent, user, authToken, "", "派生トピック", `[${title}](/topic/${parent.id.toString()})`, null, null, true, now);
    user.changeLastOneTopic(now);

    return { topic, res, resParent };
  }



  function checkData({ title, tags, text }: { title?: string, tags?: string[], text?: string }) {
    let data: paramsErrorMakerData[] = [];
    if (title !== undefined) {
      data.push({
        field: "title",
        val: title,
        regex: Config.topic.title.regex,
        message: Config.topic.title.msg
      });
    }
    if (tags !== undefined) {
      data.push(() => {
        if (tags.length !== new Set(tags).size) {
          return {
            field: "tags",
            message: "タグの重複があります"
          }
        } else {
          return null;
        }
      });

      data.push(() => {
        if (tags.length > Config.topic.tags.max) {
          return {
            field: "tags",
            message: Config.topic.tags.msg
          };
        } else {
          return null;
        }
      });

      data.push(...tags.map((x, i) => ({
        field: `tags[${i}]`,
        val: x,
        regex: Config.topic.tags.regex,
        message: Config.topic.tags.msg
      })));
    }
    if (text !== undefined) {
      data.push({
        field: "text",
        val: text,
        regex: Config.topic.text.regex,
        message: Config.topic.text.msg
      });
    }

    paramsErrorMaker(data);
  }

  export function changeData(topic: ITopicNormal, objidGenerator: IGenerator<ObjectID>, user: User, authToken: IAuthToken, title: string, tags: string[], text: string, now: Date): { res: Res, history: History } {
    user.usePoint(10);
    checkData({ title, tags, text });

    topic.title = title;
    topic.tags = tags;
    topic.text = text;
    topic.mdtext = StringUtil.md(text);

    let history = History.create(objidGenerator, topic, now, hash(topic, now, user), user);
    let res = Res.create(objidGenerator, topic, user, authToken, "", "トピックデータ", text, null, null, true, now);

    return { res, history };
  }

  export function hash(topic: ITopic, date: Date, user: User): string {
    return StringUtil.hash(
      //ユーザー依存
      user.id + " " +

      //書き込み年月日依存
      date.getFullYear() + " " + date.getMonth() + " " + date.getDate() + " " +

      //トピ依存
      topic.id.toString() +

      //ソルト依存
      Config.salt.hash);
  }
}