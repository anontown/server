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
  beforeEach(async () => {
    if (isReset) {
      await dbReset();
    }
  });
  describe("findOne", () => {
    it("正常に探せるか", async () => {
      const repo = repoGene();

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
      const repo = repoGene();

      await repo.insert(new Client(ObjectIDGenerator(),
        "name",
        "https://hoge.com",
        ObjectIDGenerator(),
        new Date(0),
        new Date(10)));

      await expect(repo.findOne(ObjectIDGenerator())).rejects.toThrow(AtError);
    });
  });

  describe("findIn", () => {
    it("正常に探せるか", async () => {
      const repo = repoGene();

      const client = new Client(ObjectIDGenerator(),
        "name",
        "https://hoge.com",
        ObjectIDGenerator(),
        new Date(0),
        new Date(100));

      const client1 = client.copy({ id: ObjectIDGenerator(), date: new Date(50) });
      const client2 = client.copy({ id: ObjectIDGenerator(), date: new Date(80) });
      const client3 = client.copy({ id: ObjectIDGenerator(), date: new Date(30) });
      const client4 = client.copy({ id: ObjectIDGenerator(), date: new Date(90) });

      await repo.insert(client1);
      await repo.insert(client2);
      await repo.insert(client3);
      await repo.insert(client4);

      expect(await repo.findIn([
        client1.id,
        client2.id,
        client3.id
      ])).toEqual([
        client3,
        client1,
        client2
      ]);

      expect(await repo.findIn([])).toEqual([]);
    });
  });

  it("存在しない物がある時エラーになるか", async () => {
    const repo = repoGene();

    const client = new Client(ObjectIDGenerator(),
      "name",
      "https://hoge.com",
      ObjectIDGenerator(),
      new Date(0),
      new Date(100));

    await repo.insert(client);

    await expect(repo.findIn([ObjectIDGenerator()])).rejects.toThrow(AtError);
    await expect(repo.findIn([ObjectIDGenerator(), client.id])).rejects.toThrow(AtError);
  });
}

describe("ClientRepoMock", () => {
  run(() => new ClientRepoMock(), false);
});

describe("ClientRepo", () => {
  run(() => new ClientRepo(), true);
});
