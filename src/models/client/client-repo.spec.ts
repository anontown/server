import {
  AtError,
  Client,
  ObjectIDGenerator,
  IClientRepo,
  ClientRepo,
  ClientRepoMock,
  dbReset
} from "../../";

function run(repoGene: () => IClientRepo, isReset: boolean) {
  describe("findOne", () => {
    it("正常に探せるか", async () => {
      if (isReset) {
        dbReset();
      }
      const repo = repoGene();
      expect.assertions(1);

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
      if (isReset) {
        dbReset();
      }
      const repo = repoGene();
      expect.assertions(1);

      await repo.insert(new Client(ObjectIDGenerator(),
        "name",
        "https://hoge.com",
        ObjectIDGenerator(),
        new Date(0),
        new Date(10)));

      expect(repo.findOne(ObjectIDGenerator())).rejects.toThrow(AtError);
    });
  });


}

describe("ClientRepoMock", () => {
  run(() => new ClientRepoMock(), false);
});

describe("ClientRepo", () => {
  run(() => new ClientRepo(), true);
});