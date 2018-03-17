import {
  AtError,
  History,
  HistoryRepo,
  HistoryRepoMock,
  dbReset,
  IHistoryRepo,
} from "../../";
import * as Im from "immutable";

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
        "body",
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
        "body",
        new Date(0),
        "hash",
        "user"));

      await expect(repo.findOne("topic2")).rejects.toThrow(AtError);
    });
  });

  describe("findIn", () => {
    it("正常に探せるか", async () => {
      const repo = repoGene();

      const history = new History("history",
        "topic",
        "title",
        Im.List(["x"]),
        "body",
        new Date(0),
        "hash",
        "user");

      const history1 = history.copy({ id: "history1", date: new Date(50) });
      const history2 = history.copy({ id: "history2", date: new Date(80) });
      const history3 = history.copy({ id: "history3", date: new Date(30) });
      const history4 = history.copy({ id: "history4", date: new Date(90) });

      await repo.insert(history1);
      await repo.insert(history2);
      await repo.insert(history3);
      await repo.insert(history4);

      expect(await repo.findIn([
        history1.id,
        history2.id,
        history3.id,
      ])).toEqual([
        history2,
        history1,
        history3,
      ]);

      expect(await repo.findIn([])).toEqual([]);
    });

    it("存在しない物がある時エラーになるか", async () => {
      const repo = repoGene();

      const history = new History("history",
        "topic",
        "title",
        Im.List(["x"]),
        "body",
        new Date(0),
        "hash",
        "user");

      await repo.insert(history);

      await expect(repo.findIn(["history2"])).rejects.toThrow(AtError);
      await expect(repo.findIn(["history2", history.id])).rejects.toThrow(AtError);
    });
  });
}

describe("HistoryRepoMock", () => {
  run(() => new HistoryRepoMock(), false);
});

describe("HistoryRepo", () => {
  run(() => new HistoryRepo(true), true);
});
