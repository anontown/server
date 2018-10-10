import * as Im from "immutable";
import {
  AtError,
  dbReset,
  History,
  IHistoryRepo,
} from "../../";

export function run(repoGene: () => IHistoryRepo, isReset: boolean) {
  beforeEach(async () => {
    if (isReset) {
      await dbReset();
    }
  });

  const history = new History("history",
    "topic",
    "title",
    Im.List(["x"]),
    "text",
    new Date(0),
    "hash",
    "user");

  describe("findOne", () => {
    it("正常に探せるか", async () => {
      const repo = repoGene();

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

      const history1 = history.copy({ id: "history1", topic: "topic1", date: new Date(50) });
      const history2 = history.copy({ id: "history2", topic: "topic1", date: new Date(80) });
      const history3 = history.copy({ id: "history3", topic: "topic1", date: new Date(30) });
      const history4 = history.copy({ id: "history4", topic: "topic2", date: new Date(90) });

      await repo.insert(history1);
      await repo.insert(history2);
      await repo.insert(history3);
      await repo.insert(history4);

      // 無
      expect(await repo.find({}, 100)).toEqual([
        history4,
        history2,
        history1,
        history3,
      ]);

      expect(await repo.find({}, 3)).toEqual([
        history4,
        history2,
        history1,
      ]);

      // topic
      expect(await repo.find({ topic: ["topic1"] }, 100)).toEqual([
        history2,
        history1,
        history3,
      ]);

      expect(await repo.find({ topic: ["topic2"] }, 100)).toEqual([
        history4,
      ]);

      expect(await repo.find({ topic: ["topic3"] }, 100)).toEqual([]);

      expect(await repo.find({ topic: [] }, 100)).toEqual([]);

      expect(await repo.find({ topic: ["topic1", "topic2"] }, 100)).toEqual([
        history4,
        history2,
        history1,
        history3,
      ]);

      // id
      expect(await repo.find({ id: [] }, 100)).toEqual([]);
      expect(await repo.find({ id: ["history2", "a"] }, 100)).toEqual([history2]);
      expect(await repo.find({ id: ["history2", "history4"] }, 100)).toEqual([
        history4,
        history2,
      ]);

      // date
      expect(await repo.find({
        date: {
          type: "gte",
          date: new Date(80).toISOString(),
        },
      }, 100)).toEqual([
        history4,
        history2,
      ]);

      expect(await repo.find({
        date: {
          type: "gt",
          date: new Date(80).toISOString(),
        },
      }, 100)).toEqual([
        history4,
      ]);

      expect(await repo.find({
        date: {
          type: "lte",
          date: new Date(50).toISOString(),
        },
      }, 100)).toEqual([
        history1,
        history3,
      ]);

      expect(await repo.find({
        date: {
          type: "lt",
          date: new Date(50).toISOString(),
        },
      }, 100)).toEqual([
        history3,
      ]);

      // 複合
      expect(await repo.find({ topic: ["topic1"], id: ["history1", "history4"] }, 100)).toEqual([
        history1,
      ]);
    });
  });

  describe("insert", () => {
    it("正常に保存出来るか", async () => {
      const repo = repoGene();

      await repo.insert(history);

      expect(await repo.findOne(history.id)).toEqual(history);
    });

    // TODO:ID被り
  });

  describe("update", () => {
    it("正常に更新出来るか", async () => {
      const repo = repoGene();

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
