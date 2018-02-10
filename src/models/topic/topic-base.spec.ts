import Copyable from "ts-copyable";
import {
  AtError,
  TopicBase,
  applyMixins,
  ITopicBaseAPI,
  User,
  Res,
  ITopicBaseDB
} from "../../";

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
});