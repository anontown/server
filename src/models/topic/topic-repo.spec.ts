import range from "array-range";
import * as Im from "immutable";
import {
  AtError,
  dbReset,
  IAuthTokenMaster,
  ResRepoMock,
  TopicRepoMock,
  TopicRepo,
  ITopicRepo,
} from "../../";

function run(repoGene: () => ITopicRepo, isReset: boolean) {
  beforeEach(async () => {
    if (isReset) {
      await dbReset();
    }
  });
}

describe("TopicRepoMock", () => {
  run(() => new TopicRepoMock(new ResRepoMock()), false);
});

describe("TopicRepo", () => {
  run(() => new TopicRepo(new ResRepoMock(), true), true);
});
