import { ObjectID } from 'mongodb';
import { User } from '../user';
import { Res } from '../res';
import { History } from '../history';
import { IAuthToken } from '../../auth';
import { AtPrerequisiteError, paramsErrorMaker } from '../../at-error'
import { Config } from '../../config';
import { StringUtil } from '../../util';
import { IGenerator } from '../../generator';

export interface ITopicDB {
  _id: ObjectID,
  title: string,
  tags: string[],
  text: string,
  mdtext: string,
  update: Date,
  date: Date,
  type: TopicType,
  ageUpdate: Date,
  active: boolean
}

export interface ITopicAPI {
  id: string,
  title: string,
  tags: string[],
  text: string,
  mdtext: string,
  update: string,
  date: string,
  resCount: number,
  type: TopicType,
  active: boolean
}

export type TopicType = "one" | "normal";

export class Topic {
  private constructor(private _id: ObjectID,
    private _title: string,
    private _tags: string[],
    private _text: string,
    private _mdtext: string,
    private _update: Date,
    private _date: Date,
    private _resCount: number,
    private _type: TopicType,
    private _ageUpdate: Date,
    private _active: boolean) {

  }

  get id() {
    return this._id;
  }

  get title() {
    return this._title;
  }

  get tags() {
    return this._tags;
  }

  get text() {
    return this._text;
  }

  get mdtext() {
    return this._mdtext;
  }

  get update() {
    return this._update;
  }

  get date() {
    return this._date;
  }

  get resCount() {
    return this._resCount;
  }

  get type() {
    return this._type;
  }

  get ageUpdate() {
    return this._ageUpdate;
  }

  get active() {
    return this._active;
  }

  toDB(): ITopicDB {
    return {
      _id: this._id,
      title: this._title,
      tags: this._tags,
      text: this._text,
      mdtext: this._mdtext,
      update: this._update,
      date: this._date,
      type: this._type,
      ageUpdate: this._ageUpdate,
      active: this._active
    }
  }

  toAPI(): ITopicAPI {
    return {
      id: this._id.toString(),
      title: this._title,
      tags: this._tags,
      text: this._text,
      mdtext: this._mdtext,
      update: this._update.toISOString(),
      date: this._date.toISOString(),
      resCount: this._resCount,
      type: this._type,
      active: this._active
    }
  }


  static fromDB(t: ITopicDB, resCount: number): Topic {
    return new Topic(t._id, t.title, t.tags, t.text, t.mdtext, t.update, t.date, resCount, t.type, t.ageUpdate, t.active);
  }

  resUpdate(res: Res) {
    if (!this._active) {
      throw new AtPrerequisiteError("トピックが落ちているので書き込めません")
    }

    this._update = res.date;
    if (res.age) {
      this._ageUpdate = res.date;
    }
  }

  static create(objidGenerator: IGenerator<ObjectID>, title: string, tags: string[], text: string, user: User, type: TopicType, authToken: IAuthToken, now: Date): { topic: Topic, res: Res, history: History | null } {
    Topic.checkData(title, tags, text);
    var topic = new Topic(objidGenerator.get(), title, tags, text, StringUtil.md(text), now, now, 1, type, now, true);
    let cd: { history: History | null, res: Res };
    if (type === "one") {
      cd = {
        history: null,
        res: Res.create(objidGenerator, topic, user, authToken, "", "トピ主", "トピックが建ちました", null, null, true, now)
      };
      user.changeLastOneTopic(now);
    } else {
      cd = topic.changeData(objidGenerator, user, authToken, title, tags, text, now);
      user.changeLastTopic(now);
    }
    return { topic, history: cd.history, res: cd.res };
  }



  private static checkData(title: string, tags: string[], text: string) {
    paramsErrorMaker([
      () => {
        if (tags.length !== new Set(tags).size) {
          return {
            field: "tags",
            message: "タグの重複があります"
          }
        } else {
          return null;
        }
      },
      () => {
        if (tags.length > Config.topic.tags.max) {
          return {
            field: "tags",
            message: Config.topic.tags.msg
          };
        } else {
          return null;
        }
      },
      {
        field: "title",
        val: title,
        regex: Config.topic.title.regex,
        message: Config.topic.title.msg
      },
      {
        field: "text",
        val: text,
        regex: Config.topic.text.regex,
        message: Config.topic.text.msg
      },
      ...tags.map((x, i) => ({
        field: `tags[${i}]`,
        val: x,
        regex: Config.topic.tags.regex,
        message: Config.topic.tags.msg
      }))
    ]);
  }

  //{{setter
  changeData(objidGenerator: IGenerator<ObjectID>, user: User, authToken: IAuthToken, title: string, tags: string[], text: string, now: Date): { res: Res, history: History } {
    user.usePoint(10);
    Topic.checkData(title, tags, text);
    if (this._type === "one") {
      throw new AtPrerequisiteError("単発トピックは編集出来ません");
    }
    if (!this._active) {
      throw new AtPrerequisiteError("トピックが落ちているので編集出来ません");
    }


    this._title = title;
    if (this._type === "normal") {
      this._tags = tags;
    }
    this._text = text;
    this._mdtext = StringUtil.md(text);

    let history = History.create(objidGenerator, this, now, this.hash(now, user), user);
    let res = Res.create(objidGenerator, this, user, authToken, "", "トピックデータ", "トピックデータが編集されました", null, null, true, now);

    return { res, history };
  }
  hash(date: Date, user: User): string {
    return StringUtil.hash(
      //ユーザー依存
      user.id + " " +

      //書き込み年月日依存
      date.getFullYear() + " " + date.getMonth() + " " + date.getDate() + " " +

      //トピ依存
      this._id +

      //ソルト依存
      Config.salt.hash);
  }
}
