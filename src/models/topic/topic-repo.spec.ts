import * as Im from "immutable";
import {
  dbReset,
  ResRepoMock,
  TopicRepoMock,
  TopicRepo,
  ITopicRepo,
  TopicNormal,
  AtError,
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

  describe("findTags", () => {
    it("正常に検索出来るか", async () => {
      const repo = repoGene();
      await repo.insert(topicNormal.copy({ id: "topic1", tags: Im.List(["a"]) }));
      await repo.insert(topicNormal.copy({ id: "topic2", tags: Im.List([""]) }));
      await repo.insert(topicNormal.copy({ id: "topic3", tags: Im.List(["a", "b"]) }));
      await repo.insert(topicNormal.copy({ id: "topic4", tags: Im.List(["b"]) }));
      await repo.insert(topicNormal.copy({ id: "topic5", tags: Im.List(["b", "c"]) }));

      expect(await repo.findTags(0)).toEqual([]);
      expect(await repo.findTags(2)).toEqual([{ name: "b", count: 3 }, { name: "a", count: 2 }]);
      expect(await repo.findTags(100)).toEqual([
        { name: "b", count: 3 },
        { name: "a", count: 2 },
        { name: "c", count: 1 }
      ]);
    });
  });

  describe("find", () => {
    it("正常に検索出来るか", async () => {
      //TODO:activeOnly
      const repo = repoGene();

      const topic1 = topicNormal.copy({
        id: "topic1",
        tags: Im.List(["a"]),
        title: "x",
        ageUpdate: new Date(10),
      });

      const topic2 = topicNormal.copy({
        id: "topic2",
        tags: Im.List(["a", "b"]),
        title: "y",
        ageUpdate: new Date(20),
      });

      const topic3 = topicNormal.copy({
        id: "topic3",
        tags: Im.List([]),
        title: "x y",
        ageUpdate: new Date(40),
      });

      const topic4 = topicNormal.copy({
        id: "topic4",
        tags: Im.List(["a"]),
        title: "x",
        ageUpdate: new Date(30),
      });

      const topic5 = topicNormal.copy({
        id: "topic5",
        tags: Im.List(["a"]),
        title: "",
        ageUpdate: new Date(50),
      });

      await repo.insert(topic1);
      await repo.insert(topic2);
      await repo.insert(topic3);
      await repo.insert(topic4);
      await repo.insert(topic5);


      expect(await repo.find([], [], 0, 10, true)).toEqual([
        topic5,
        topic3,
        topic4,
        topic2,
        topic1,
      ]);

      expect(await repo.find([], [], 1, 2, true)).toEqual([
        topic3,
        topic4,
      ]);

      expect(await repo.find([], ["a"], 0, 10, true)).toEqual([
        topic5,
        topic4,
        topic2,
        topic1,
      ]);

      expect(await repo.find([], ["a", "b"], 0, 10, true)).toEqual([
        topic2,
      ]);

      expect(await repo.find(["x"], [], 0, 10, true)).toEqual([
        topic3,
        topic4,
        topic1,
      ]);

      expect(await repo.find(["x", "y"], [], 0, 10, true)).toEqual([
        topic3,
      ]);
    });
  });
}

describe("TopicRepoMock", () => {
  run(() => new TopicRepoMock(new ResRepoMock()), false);
});

describe("TopicRepo", () => {
  run(() => new TopicRepo(new ResRepoMock(), true), true);
});
