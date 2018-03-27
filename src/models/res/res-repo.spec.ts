import {
  AtError,
  dbReset,
  IResRepo,
  ResNormal,
  ResRepo,
  ResRepoMock,
} from "../../";
import * as Im from "immutable";

function run(repoGene: () => IResRepo, isReset: boolean) {
  beforeEach(async () => {
    if (isReset) {
      await dbReset();
    }
  });

  describe("findOne", () => {
    it("正常に探せるか", async () => {
      const repo = repoGene();

      const res = new ResNormal("name",
        "body",
        null,
        "active",
        null,
        true,
        "res",
        "topic",
        new Date(0),
        "user",
        Im.List(),
        5,
        "hash",
        0
      );

      await repo.insert(res);
      await repo.insert(res.copy({ id: "res2" }));

      expect(await repo.findOne(res.id)).toEqual(res);
    });

    it("存在しない時エラーになるか", async () => {
      const repo = repoGene();

      await repo.insert(new ResNormal("name",
        "body",
        null,
        "active",
        null,
        true,
        "res",
        "topic",
        new Date(0),
        "user",
        Im.List(),
        5,
        "hash",
        0
      ));

      await expect(repo.findOne("res2")).rejects.toThrow(AtError);
    });
  });

  describe("findIn", () => {
    it("正常に探せるか", async () => {
      const repo = repoGene();

      const res = new ResNormal("name",
        "body",
        null,
        "active",
        null,
        true,
        "res",
        "topic",
        new Date(0),
        "user",
        Im.List(),
        5,
        "hash",
        0
      );

      const res1 = res.copy({ id: "res1", date: new Date(50) });
      const res2 = res.copy({ id: "res2", date: new Date(80) });
      const res3 = res.copy({ id: "res3", date: new Date(30) });
      const res4 = res.copy({ id: "res4", date: new Date(90) });

      await repo.insert(res1);
      await repo.insert(res2);
      await repo.insert(res3);
      await repo.insert(res4);

      expect(await repo.findIn([
        res1.id,
        res2.id,
        res3.id,
      ])).toEqual([
        res2,
        res1,
        res3,
      ]);

      expect(await repo.findIn([])).toEqual([]);
    });

    it("存在しない物がある時エラーになるか", async () => {
      const repo = repoGene();

      const res = new ResNormal("name",
        "body",
        null,
        "active",
        null,
        true,
        "res",
        "topic",
        new Date(0),
        "user",
        Im.List(),
        5,
        "hash",
        0
      );

      await repo.insert(res);

      await expect(repo.findIn(["res2"])).rejects.toThrow(AtError);
      await expect(repo.findIn(["res2", res.id])).rejects.toThrow(AtError);
    });
  });
}

describe("ResRepoMock", () => {
  run(() => new ResRepoMock(), false);
});

describe("ResRepo", () => {
  run(() => new ResRepo(true), true);
});
