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

      const topic1 = topicNormal.copy({ id: "topic1" });
      const topic2 = topicNormal.copy({ id: "topic2" });

      await repo.insert(topic1);
      await repo.insert(topic2);

      expect(await repo.findOne("topic1")).toEqual(topic1);
    });

    it("存在しない時エラーになるか", async () => {
      const repo = repoGene();

      await repo.insert(topicNormal.copy({ id: "topic1" }));

      await expect(repo.findOne("topic2")).rejects.toThrow(AtError);
    });
  });

  describe("findIn", () => {
    it("正常に探せるか", async () => {
      const repo = repoGene();

      const topic1 = topicNormal.copy({ id: "topic1", ageUpdate: new Date(50) });
      const topic2 = topicNormal.copy({ id: "topic2", ageUpdate: new Date(80) });
      const topic3 = topicNormal.copy({ id: "topic3", ageUpdate: new Date(30) });
      const topic4 = topicNormal.copy({ id: "topic4", ageUpdate: new Date(90) });

      await repo.insert(topic1);
      await repo.insert(topic2);
      await repo.insert(topic3);
      await repo.insert(topic4);

      expect(await repo.findIn([
        topic1.id,
        topic2.id,
        topic3.id,
      ])).toEqual([
        topic2,
        topic1,
        topic3,
      ]);

      expect(await repo.findIn([])).toEqual([]);
    });

    it("存在しない物がある時エラーになるか", async () => {
      const repo = repoGene();

      await repo.insert(topicNormal.copy({ id: "topic1" }));

      await expect(repo.findIn(["topic2"])).rejects.toThrow(AtError);
      await expect(repo.findIn(["topic2", "topic1"])).rejects.toThrow(AtError);
    });
  });
}

describe("TopicRepoMock", () => {
  run(() => new TopicRepoMock(new ResRepoMock()), false);
});

describe("TopicRepo", () => {
  run(() => new TopicRepo(new ResRepoMock(), true), true);
});
