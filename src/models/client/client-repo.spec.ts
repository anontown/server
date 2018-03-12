import {
  AtError,
  Client,
  ClientRepo,
  ClientRepoMock,
  dbReset,
  IClientRepo,
  ObjectIDGenerator,
} from "../../";

function run(repoGene: () => IClientRepo, isReset: boolean) {
  async function pre(assertions: number) {
    expect.assertions(assertions);
    if (isReset) {
      await dbReset();
    }
    return repoGene();
  }
  describe("findOne", () => {
    it("正常に探せるか", async () => {
      const repo = await pre(1);

      const client = new Client(ObjectIDGenerator(),
        "name",
        "https://hoge.com",
        ObjectIDGenerator(),
        new Date(0),
        new Date(10));

      await repo.insert(client);
      await repo.insert(client.copy({ id: ObjectIDGenerator() }));

      expect(await repo.findOne(client.id)).toEqual(client);
    });

    it("存在しない時エラーになるか", async () => {
      const repo = await pre(1);

      await repo.insert(new Client(ObjectIDGenerator(),
        "name",
        "https://hoge.com",
        ObjectIDGenerator(),
        new Date(0),
        new Date(10)));

      await expect(repo.findOne(ObjectIDGenerator())).rejects.toThrow(AtError);
    });
  });

}

describe("ClientRepoMock", () => {
  run(() => new ClientRepoMock(), false);
});

describe("ClientRepo", () => {
  run(() => new ClientRepo(), true);
});
