import Copyable from "ts-copyable";
import {
  ObjectIDGenerator,
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

});