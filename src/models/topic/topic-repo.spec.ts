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

  describe("findIn", () => {
    it("正常に探せるか", async () => {
      const repo = repoGene();

      const topic1 = topicNormal.copy({ id: "topic1", ageUpdate: new Date(50) });
      const topic2 = topicNormal.copy({ id: "topic2", ageUpdate: new Date(80) });
      const topic3 = topicOne.copy({ id: "topic3", ageUpdate: new Date(30) });
      const topic4 = topicFork.copy({ id: "topic4", ageUpdate: new Date(90) });

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

  describe("find", () => {
    it("正常に検索出来るか", async () => {
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

      const topic4 = topicNormal.copy({
        id: "topic4",
        tags: Im.List(["a"]),
        title: "x",
        ageUpdate: new Date(30),
      });

      const topic5 = topicOne.copy({
        id: "topic5",
        tags: Im.List(["a"]),
        title: "",
        ageUpdate: new Date(50),
      });

      const topic6 = topicFork.copy({
        id: "topic6",
        parent: "topic1",
        title: "x",
      });

      await repo.insert(topic1);
      await repo.insert(topic2);
      await repo.insert(topic3);
      await repo.insert(topic4);
      await repo.insert(topic5);
      await repo.insert(topic6);

      expect(await repo.find("", [], 0, 10, true)).toEqual([
        topic5,
        topic3,
        topic4,
        topic2,
      ]);

      expect(await repo.find("", [], 1, 2, false)).toEqual([
        topic3,
        topic4,
      ]);

      expect(await repo.find("", ["a"], 0, 10, false)).toEqual([
        topic5,
        topic4,
        topic2,
        topic1,
      ]);

      expect(await repo.find("", ["a", "b"], 0, 10, false)).toEqual([
        topic2,
      ]);

      expect(await repo.find("x", [], 0, 10, false)).toEqual([
        topic3,
        topic4,
        topic1,
      ]);

      expect(await repo.find("y x", [], 0, 10, false)).toEqual([
        topic3,
      ]);
    });
  });

  describe("findFork", () => {
    it("正常に検索出来るか", async () => {
      const repo = repoGene();

      const topic1 = topicNormal.copy({
        id: "topic1",
        ageUpdate: new Date(20),
      });

      const topic2 = topicFork.copy({
        id: "topic2",
        parent: "topic1",
        ageUpdate: new Date(30),
      });

      const topic3 = topicNormal.copy({
        id: "topic3",
        ageUpdate: new Date(40),
      });

      const topic4 = topicFork.copy({
        id: "topic4",
        parent: "topic1",
        ageUpdate: new Date(10),
        active: false,
      });

      const topic5 = topicFork.copy({
        id: "topic5",
        parent: "topic2",
        ageUpdate: new Date(50),
      });

      const topic6 = topicFork.copy({
        id: "topic6",
        parent: "topic1",
        ageUpdate: new Date(60),
      });

      await repo.insert(topic1);
      await repo.insert(topic2);
      await repo.insert(topic3);
      await repo.insert(topic4);
      await repo.insert(topic5);
      await repo.insert(topic6);

      expect(await repo.findFork("topic1", 0, 10, false)).toEqual([
        topic6,
        topic2,
        topic4,
      ]);

      expect(await repo.findFork("topic1", 1, 10, false)).toEqual([
        topic2,
        topic4,
      ]);

      expect(await repo.findFork("topic1", 0, 2, false)).toEqual([
        topic6,
        topic2,
      ]);

      expect(await repo.findFork("topic3", 0, 10, false)).toEqual([]);

      expect(await repo.findFork("topic1", 0, 10, true)).toEqual([
        topic6,
        topic2,
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
