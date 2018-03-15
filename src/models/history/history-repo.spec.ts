import {
  AtError,
  History,
  HistoryRepo,
  HistoryRepoMock,
  dbReset,
  IHistoryRepo,
  ObjectIDGenerator,
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

      const topic = new History("history",
        "topic",
        "title",
        Im.List(["x"]),
        "body",
        new Date(0),
        "hash",
        "user");

      await repo.insert(topic);
      await repo.insert(topic.copy({ id: "topic2" }));

      expect(await repo.findOne(topic.id)).toEqual(topic);
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
}

describe("HistoryRepoMock", () => {
  run(() => new HistoryRepoMock(), false);
});

describe("HistoryRepo", () => {
  run(() => new HistoryRepo(), true);
});
