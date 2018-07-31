import * as Im from "immutable";
import {
  AtError,
  dbReset,
  History,
  HistoryRepo,
  HistoryRepoMock,
  IHistoryRepo,
} from "../../";

function run(repoGene: () => IHistoryRepo, isReset: boolean) {
  beforeEach(async () => {
    if (isReset) {
      await dbReset();
    }
  });
  describe("findOne", () => {
    it("正常に探せるか", async () => {
      const repo = repoGene();

      const history = new History("history",
        "topic",
        "title",
        Im.List(["x"]),
        "text",
        new Date(0),
        "hash",
        "user");

      await repo.insert(history);
      await repo.insert(history.copy({ id: "topic2" }));

      expect(await repo.findOne(history.id)).toEqual(history);
    });

    it("存在しない時エラーになるか", async () => {
      const repo = repoGene();

      await repo.insert(new History("history",
        "topic",
        "title",
        Im.List(["x"]),
        "text",
        new Date(0),
        "hash",
        "user"));

      await expect(repo.findOne("topic2")).rejects.toThrow(AtError);
    });
  });

  describe("find", () => {
    it("正常に検索出来るか", async () => {
      const repo = repoGene();

      const history = new History("history",
        "topic",
        "title",
        Im.List(["x"]),
        "text",
        new Date(0),
        "hash",
        "user");

      const history1 = history.copy({ id: "history1", topic: "topic1", date: new Date(50) });
      const history2 = history.copy({ id: "history2", topic: "topic1", date: new Date(80) });
      const history3 = history.copy({ id: "history3", topic: "topic1", date: new Date(30) });
      const history4 = history.copy({ id: "history4", topic: "topic2", date: new Date(90) });

      await repo.insert(history1);
      await repo.insert(history2);
      await repo.insert(history3);
      await repo.insert(history4);

      expect(await repo.find({})).toEqual([
        history4,
        history2,
        history1,
        history3,
      ]);

      expect(await repo.find({ topic: ["topic1"] })).toEqual([
        history2,
        history1,
        history3,
      ]);

      expect(await repo.find({ topic: ["topic2"] })).toEqual([
        history4,
      ]);

      expect(await repo.find({ topic: ["topic3"] })).toEqual([]);

      expect(await repo.find({ topic: [] })).toEqual([]);

      expect(await repo.find({ topic: ["topic1", "topic2"] })).toEqual([
        history4,
        history2,
        history1,
        history3,
      ]);

      expect(await repo.find({ id: [] })).toEqual([]);
      expect(await repo.find({ id: ["history2", "a"] })).toEqual([history2]);
      expect(await repo.find({ id: ["history2", "history4"] })).toEqual([
        history4,
        history2,
      ]);

      expect(await repo.find({ topic: ["topic1"], id: ["history2", "history4"] })).toEqual([
        history2,
      ]);
    });
  });

  describe("insert", () => {
    it("正常に保存出来るか", async () => {
      const repo = repoGene();

      const history = new History("history",
        "topic",
        "title",
        Im.List(["x"]),
        "text",
        new Date(0),
        "hash",
        "user");

      await repo.insert(history);

      expect(await repo.findOne(history.id)).toEqual(history);
    });

    // TODO:ID被り
  });

  describe("update", () => {
    it("正常に更新出来るか", async () => {
      const repo = repoGene();

      const history = new History("history",
        "topic",
        "title",
        Im.List(["x"]),
        "text",
        new Date(0),
        "hash",
        "user");

      const history1 = history.copy({ id: "history1" });
      const history2 = history.copy({ id: "history2" });
      const history1update = history1.copy({ text: "update" });

      await repo.insert(history1);
      await repo.insert(history2);

      await repo.update(history1update);

      expect(await repo.findOne(history1.id)).toEqual(history1update);
      expect(await repo.findOne(history2.id)).toEqual(history2);
    });

    // TODO:存在しないID
  });
}

describe("HistoryRepoMock", () => {
  run(() => new HistoryRepoMock(), false);
});

describe("HistoryRepo", () => {
  run(() => new HistoryRepo(true), true);
});
