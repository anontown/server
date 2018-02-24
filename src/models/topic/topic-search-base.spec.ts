import * as Im from "immutable";
import Copyable, { PartialMap } from "ts-copyable";
import {
  AtError,
  TopicBase,
  applyMixins,
  ITopicBaseAPI,
  User,
  Res,
  ITopicBaseDB,
  ResNormal,
  ResTopic,
  IGenerator,
  TopicSearchBase,
  ITopicSearchBaseAPI,
  ITopicSearchBaseDB
} from "../../";


describe("TopicSearchBase", () => {
  class TopicSearchBaseTest extends Copyable<TopicSearchBaseTest> implements TopicSearchBase<"normal", TopicSearchBaseTest> {
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
      readonly body: string,
      readonly update: Date,
      readonly date: Date,
      readonly resCount: number,
      readonly ageUpdate: Date,
      readonly active: boolean) {
      super(TopicSearchBaseTest);
    }
  }
  applyMixins(TopicSearchBaseTest, [TopicSearchBase]);
});