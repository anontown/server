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
});