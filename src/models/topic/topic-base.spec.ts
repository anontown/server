import Copyable from "ts-copyable";
import {
  AtError,
  TopicBase,
  applyMixins,
  ITopicBaseAPI,
  User,
  Res,
  ITopicBaseDB,
  ResNormal,
  ResTopic
} from "../../";
import * as Im from "immutable";

describe("TopicBase", () => {
  class TopicBaseTest extends Copyable<TopicBaseTest> implements TopicBase<"normal", TopicBaseTest> {
    readonly type: "normal" = "normal";
    toBaseAPI!: () => ITopicBaseAPI<"normal">;
    hash!: (date: Date, user: User) => string;
    resUpdate!: (res: Res) => TopicBaseTest;
    toBaseDB!: <Body extends object>(body: Body) => ITopicBaseDB<"normal", Body>;

    constructor(
      readonly id: string,
      readonly title: string,
      readonly update: Date,
      readonly date: Date,
      readonly resCount: number,
      readonly ageUpdate: Date,
      readonly active: boolean, ) {
      super(TopicBaseTest);
    }
  }
  applyMixins(TopicBaseTest, [TopicBase]);

  const topicBase = new TopicBaseTest("topic",
    "title",
    new Date(100),
    new Date(0),
    10,
    new Date(50),
    true);

  describe("checkData", () => {
    it("正常に動くか", () => {
      TopicBase.checkData({ title: "title", tags: ["a", "b"], body: "body" });
      TopicBase.checkData({ title: "title", tags: [], body: "body" });
    });

    it("タイトルが長すぎるとエラーになるか", () => {
      expect(() => {
        TopicBase.checkData({ title: "x".repeat(101) });
      }).toThrow(AtError);
    });

    it("タグの文字が不正だとエラーになるか", () => {
      expect(() => {
        TopicBase.checkData({ tags: ["a", "a b"] });
      }).toThrow(AtError);

      expect(() => {
        TopicBase.checkData({ tags: ["x", ""] });
      }).toThrow(AtError);

      expect(() => {
        TopicBase.checkData({ tags: ["a".repeat(21), "a"] });
      }).toThrow(AtError);
    });

    it("タグに重複があるとエラーになるか", () => {
      expect(() => {
        TopicBase.checkData({ tags: ["a", "b", "a"] });
      });
    });

    it("タグの数が多すぎるとエラーになるか", () => {
      expect(() => {
        TopicBase.checkData({
          tags: [
            "a",
            "b",
            "c",
            "d",
            "e",
            "f",
            "g",
            "h",
            "i",
            "j",
            "k",
            "l",
            "m",
            "n",
            "o",
            "p"
          ]
        });
      });
    });

    it("本文が長すぎるとエラーになるか", () => {
      expect(() => {
        TopicBase.checkData({ body: "x".repeat(10001) });
      }).toThrow(AtError);
    });
  });

  describe("toBaseDB", () => {
    it("正常に変換出来るか", () => {
      expect(topicBase.toBaseDB({})).toEqual({
        id: "topic",
        type: "normal",
        body: {
          title: "title",
          update: new Date(100).toISOString(),
          date: new Date(0).toISOString(),
          ageUpdate: new Date(50).toISOString(),
          active: true,
        },
      });
    });
  });

  describe("toBaseAPI", () => {
    it("正常に変換出来るか", () => {
      expect(topicBase.toBaseAPI).toEqual({
        id: "topic",
        title: "title",
        update: new Date(100).toISOString(),
        date: new Date(0).toISOString(),
        resCount: 10,
        type: "normal",
        active: true,
      });
    });
  });

  describe("resUpdate", () => {
    const resNormal = new ResNormal(null,
      "body",
      null,
      "active",
      null,
      true,
      "res",
      "topic",
      new Date(200),
      "user",
      Im.List(),
      10,
      "hash",
      0);

    const resTopic = new ResTopic("res",
      "topic",
      new Date(200),
      "user",
      Im.List(),
      10,
      "hash",
      10);
    it("ageの時正常に呼び出せるか", () => {
      expect(topicBase.resUpdate(resNormal)).toEqual(topicBase.copy({
        update: new Date(200),
        ageUpdate: new Date(200)
      }));
    });

    it("ResNormalかつageでない時正常に呼び出せるか", () => {
      expect(topicBase.resUpdate(resNormal.copy({ age: false }))).toEqual(topicBase.copy({
        update: new Date(200),
        ageUpdate: new Date(50)
      }));
    });

    it("ResNormalでない時正常に呼び出されるか", () => {
      expect(topicBase.resUpdate(resTopic)).toEqual(topicBase.copy({
        update: new Date(200),
        ageUpdate: new Date(50)
      }));
    });

    it("Topicが死んでいる時エラーになるか", () => {
      expect(() => {
        topicBase.copy({ active: false }).resUpdate(resNormal)
      }).toThrow(AtError);
    });
  });
});