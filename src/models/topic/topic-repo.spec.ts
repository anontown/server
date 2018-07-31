import * as Im from "immutable";
import {
  AtError,
  dbReset,
  ITopicRepo,
  ResRepoMock,
  TopicFork,
  TopicNormal,
  TopicOne,
  TopicRepo,
  TopicRepoMock,
} from "../../";

function run(repoGene: () => ITopicRepo, isReset: boolean) {
  const topicNormal = new TopicNormal("topicn",
    "title",
    Im.List(),
    "text",
    new Date(20),
    new Date(0),
    0,
    new Date(10),
    true);

  const topicOne = new TopicOne("topico",
    "title",
    Im.List(),
    "text",
    new Date(20),
    new Date(0),
    0,
    new Date(10),
    true);

  const topicFork = new TopicFork("topicf",
    "title",
    new Date(20),
    new Date(0),
    0,
    new Date(10),
    true,
    "topicn");

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

  describe("find2", () => {
    it("正常に探せるか", async () => {
      const repo = repoGene();

      const topic1 = topicNormal.copy({
        id: "topic1",
        tags: Im.List(["a"]),
        title: "x",
        ageUpdate: new Date(10),
        active: false,
      });

      const topic2 = topicNormal.copy({
        id: "topic2",
        tags: Im.List(["a", "b"]),
        title: "y",
        ageUpdate: new Date(20),
      });

      const topic3 = topicOne.copy({
        id: "topic3",
        tags: Im.List([]),
        title: "x y",
        ageUpdate: new Date(40),
      });

      const topic4 = topicOne.copy({
        id: "topic4",
        tags: Im.List(["a"]),
        title: "",
        ageUpdate: new Date(50),
        active: false,
      });

      const topic5 = topicFork.copy({
        id: "topic5",
        parent: "topic2",
        title: "x",
        ageUpdate: new Date(60),
      });

      const topic6 = topicFork.copy({
        id: "topic6",
        parent: "topic1",
        title: "x",
        ageUpdate: new Date(30),
        active: false,
      });

      await repo.insert(topic1);
      await repo.insert(topic2);
      await repo.insert(topic3);
      await repo.insert(topic4);
      await repo.insert(topic5);
      await repo.insert(topic6);

      expect(await repo.find2({
      }, 0, 100)).toEqual([
        topic5,
        topic4,
        topic3,
        topic6,
        topic2,
        topic1,
      ]);

      expect(await repo.find2({
      }, 1, 3)).toEqual([
        topic4,
        topic3,
        topic6,
      ]);

      expect(await repo.find2({
        id: [],
      }, 0, 100)).toEqual([]);

      expect(await repo.find2({
        id: ["topic1", "topic5", "other"],
      }, 0, 100)).toEqual([
        topic5,
        topic1,
      ]);

      expect(await repo.find2({
        title: "",
      }, 0, 100)).toEqual([
        topic5,
        topic4,
        topic3,
        topic6,
        topic2,
        topic1,
      ]);

      expect(await repo.find2({
        title: "x",
      }, 0, 100)).toEqual([
        topic5,
        topic3,
        topic6,
        topic1,
      ]);

      expect(await repo.find2({
        title: "x a",
      }, 0, 100)).toEqual([]);

      expect(await repo.find2({
        title: "x y",
      }, 0, 100)).toEqual([
        topic3,
      ]);

      expect(await repo.find2({
        tags: [],
      }, 0, 100)).toEqual([
        topic5,
        topic4,
        topic3,
        topic6,
        topic2,
        topic1,
      ]);

      expect(await repo.find2({
        tags: ["a"],
      }, 0, 100)).toEqual([
        topic4,
        topic2,
        topic1,
      ]);

      expect(await repo.find2({
        tags: ["a", "b"],
      }, 0, 100)).toEqual([
        topic2,
      ]);

      expect(await repo.find2({
        tags: ["x"],
      }, 0, 100)).toEqual([
      ]);

      expect(await repo.find2({
        activeOnly: false,
      }, 0, 100)).toEqual([
        topic5,
        topic4,
        topic3,
        topic6,
        topic2,
        topic1,
      ]);

      expect(await repo.find2({
        activeOnly: true,
      }, 0, 100)).toEqual([
        topic5,
        topic3,
        topic2,
      ]);

      expect(await repo.find2({
        parent: "topic1",
      }, 0, 100)).toEqual([
        topic6,
      ]);

      expect(await repo.find2({
        parent: "other",
      }, 0, 100)).toEqual([
      ]);
    });
  });

  describe("findTags", () => {
    it("正常に検索出来るか", async () => {
      const repo = repoGene();
      await repo.insert(topicNormal.copy({ id: "topic1", tags: Im.List(["a"]) }));
      await repo.insert(topicNormal.copy({ id: "topic2", tags: Im.List([]) }));
      await repo.insert(topicOne.copy({ id: "topic3", tags: Im.List(["a", "b"]) }));
      await repo.insert(topicNormal.copy({ id: "topic4", tags: Im.List(["b"]) }));
      await repo.insert(topicNormal.copy({ id: "topic5", tags: Im.List(["b", "c"]) }));
      await repo.insert(topicFork.copy({ id: "topic6", parent: "topic1" }));

      expect(await repo.findTags(0)).toEqual([]);
      expect(await repo.findTags(2)).toEqual([{ name: "b", count: 3 }, { name: "a", count: 2 }]);
      expect(await repo.findTags(100)).toEqual([
        { name: "b", count: 3 },
        { name: "a", count: 2 },
        { name: "c", count: 1 },
      ]);
    });
  });

  describe("cronTopicCheck", () => {
    it("正常に更新出来るか", async () => {
      const repo = repoGene();

      const topic1 = topicNormal.copy({
        id: "topic1",
        update: new Date(20),
      });

      const topic2 = topicFork.copy({
        id: "topic2",
        parent: "topic1",
        update: new Date(30),
      });

      const topic3 = topicOne.copy({
        id: "topic3",
        update: new Date(40),
      });

      const topic4 = topicFork.copy({
        id: "topic4",
        parent: "topic1",
        update: new Date(10),
        active: false,
      });

      const topic5 = topicFork.copy({
        id: "topic5",
        parent: "topic2",
        update: new Date(500000000),
      });

      await repo.insert(topic1);
      await repo.insert(topic2);
      await repo.insert(topic3);
      await repo.insert(topic4);
      await repo.insert(topic5);

      await repo.cronTopicCheck(new Date(1000000000));

      expect(await repo.findOne(topic1.id)).toEqual(topic1);
      expect(await repo.findOne(topic2.id)).toEqual(topic2.copy({ active: false }));
      expect(await repo.findOne(topic3.id)).toEqual(topic3.copy({ active: false }));
      expect(await repo.findOne(topic4.id)).toEqual(topic4);
      expect(await repo.findOne(topic5.id)).toEqual(topic5);
    });
  });

  describe("insert", () => {
    it("正常に保存出来るか", async () => {
      const repo = repoGene();

      await repo.insert(topicNormal);
      await repo.insert(topicOne);
      await repo.insert(topicFork);

      expect(await repo.findOne(topicNormal.id)).toEqual(topicNormal);
      expect(await repo.findOne(topicOne.id)).toEqual(topicOne);
      expect(await repo.findOne(topicFork.id)).toEqual(topicFork);
    });

    // TODO:ID被り
  });

  describe("update", () => {
    it("正常に更新出来るか", async () => {
      const repo = repoGene();

      await repo.insert(topicNormal);
      await repo.insert(topicOne);
      await repo.insert(topicFork);

      const t1 = topicNormal.copy({ title: "update1" });
      const t2 = topicOne.copy({ title: "update2" });
      const t3 = topicFork.copy({ title: "update3" });

      await repo.update(t1);
      await repo.update(t2);
      await repo.update(t3);

      expect(await repo.findOne(t1.id)).toEqual(t1);
      expect(await repo.findOne(t2.id)).toEqual(t2);
      expect(await repo.findOne(t3.id)).toEqual(t3);
    });

    // TODO:存在しないID
  });
}

describe("TopicRepoMock", () => {
  run(() => new TopicRepoMock(new ResRepoMock()), false);
});

describe("TopicRepo", () => {
  run(() => new TopicRepo(new ResRepoMock(), true), true);
});
