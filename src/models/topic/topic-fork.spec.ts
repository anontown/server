import * as Im from "immutable";
import {
  TopicFork,
  IAuthTokenMaster,
  TopicNormal,
  User,
} from "../../";

describe("TopicFork", () => {
  const topicFork = new TopicFork("topic",
    "title",
    new Date(100),
    new Date(0),
    5,
    new Date(50),
    true,
    "parent");

  describe("fromDB", () => {
    it("正常に生成できるか", () => {
      expect(TopicFork.fromDB({
        id: "topic",
        type: "fork",
        body: {
          title: "title",
          update: new Date(100).toISOString(),
          date: new Date(0).toISOString(),
          ageUpdate: new Date(50).toISOString(),
          active: true,
          parent: "parent"
        }
      }, 5)).toEqual(topicFork);
    });
  });
});