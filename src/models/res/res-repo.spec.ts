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
}

describe("ResRepoMock", () => {
  run(() => new ResRepoMock(), false);
});

describe("ResRepo", () => {
  run(() => new ResRepo(), true);
});
