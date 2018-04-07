import * as Im from "immutable";
import Copyable from "ts-copyable";
import {
  applyMixins,
  ITopicBaseAPI,
  ITopicBaseDB,
  ITopicSearchBaseAPI,
  ITopicSearchBaseDB,
  Res,
  TopicSearchBase,
  User,
} from "../../";

describe("TopicSearchBase", () => {
  class TopicSearchBaseTest
    extends Copyable<TopicSearchBaseTest>
    implements TopicSearchBase<"normal", TopicSearchBaseTest> {
    readonly type: "normal" = "normal";

    toBaseAPI!: () => ITopicBaseAPI<"normal">;
    hash!: (date: Date, user: User) => string;
    toAPI!: () => ITopicSearchBaseAPI<"normal">;
    resUpdate!: (res: Res) => TopicSearchBaseTest;
    toDB!: () => ITopicSearchBaseDB<"normal">;
    toBaseDB!: <Body extends object>(body: Body) => ITopicBaseDB<"normal", Body>;

    constructor(
      readonly id: string,
      readonly title: string,
      readonly tags: Im.List<string>,
      readonly text: string,
      readonly update: Date,
      readonly date: Date,
      readonly resCount: number,
      readonly ageUpdate: Date,
      readonly active: boolean) {
      super(TopicSearchBaseTest);
    }
  }
  applyMixins(TopicSearchBaseTest, [TopicSearchBase]);

  const topic = new TopicSearchBaseTest("topic",
    "title",
    Im.List(),
    "text",
    new Date(100),
    new Date(0),
    10,
    new Date(50),
    true);

  describe("toDB", () => {
    it("正常に変換出来るか", () => {
      expect(topic.toDB()).toEqual(topic.toBaseDB({
        tags: [],
        text: "text",
      }));
    });
  });

  describe("toAPI", () => {
    it("正常に変換出来るか", () => {
      expect(topic.toAPI()).toEqual({
        ...topic.toBaseAPI(),
        tags: [],
        text: "text",
      });
    });
  });
});
