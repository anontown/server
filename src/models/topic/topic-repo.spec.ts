import * as Im from "immutable";
import {
  dbReset,
  ResRepoMock,
  TopicRepoMock,
  TopicRepo,
  ITopicRepo,
  TopicNormal,
  AtError
} from "../../";

function run(repoGene: () => ITopicRepo, isReset: boolean) {
  const topicNormal = new TopicNormal("topicn",
    "title",
    Im.List(),
    "body",
    new Date(20),
    new Date(0),
    0,
    new Date(10),
    true);

  beforeEach(async () => {
    if (isReset) {
      await dbReset();
    }
  });

  describe("findOne", () => {
    it("正常に取得出来るか", async () => {
      const repo = repoGene();

      await repo.insert(topicNormal.copy({ id: "topic1" }));
      await repo.insert(topicNormal.copy({ id: "topic2" }));

      expect(await repo.findOne("topic1")).toEqual(topicNormal);
    });

    it("存在しない時エラーになるか", async () => {
      const repo = repoGene();

      await repo.insert(topicNormal.copy({ id: "topic1" }));

      await expect(repo.findOne("topic2")).rejects.toThrow(AtError);
    });
  });
}

describe("TopicRepoMock", () => {
  run(() => new TopicRepoMock(new ResRepoMock()), false);
});

describe("TopicRepo", () => {
  run(() => new TopicRepo(new ResRepoMock(), true), true);
});
