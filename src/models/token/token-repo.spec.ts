import {
  AtError,
  TokenMaster,
  TokenRepo,
  TokenRepoMock,
  dbReset,
  ITokenRepo,
  ObjectIDGenerator,
  ClientRepoMock,
} from "../../";

function run(repoGene: () => ITokenRepo, isReset: boolean) {
  beforeEach(async () => {
    if (isReset) {
      await dbReset();
    }
  });

  describe("findOne", () => {
    it("正常に探せるか", async () => {
      const repo = repoGene();

      const token = new TokenMaster(ObjectIDGenerator(),
        "key",
        ObjectIDGenerator(),
        new Date(0));

      await repo.insert(token);
      await repo.insert(token.copy({ id: ObjectIDGenerator() }));

      expect(await repo.findOne(token.id)).toEqual(token);
    });

    it("存在しない時エラーになるか", async () => {
      const repo = repoGene();

      await repo.insert(new TokenMaster(ObjectIDGenerator(),
        "key",
        ObjectIDGenerator(),
        new Date(0)));

      await expect(repo.findOne(ObjectIDGenerator())).rejects.toThrow(AtError);
    });
  });
}

describe("TokenRepoMock", () => {
  run(() => new TokenRepoMock(new ClientRepoMock()), false);
});

describe("TokenRepo", () => {
  run(() => new TokenRepo(new ClientRepoMock()), true);
});
