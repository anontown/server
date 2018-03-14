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
        client3.id,
      ])).toEqual([
        client2,
        client1,
        client3,
      ]);

      expect(await repo.findIn([])).toEqual([]);
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
  });

  describe("findAll", () => {
    it("正常に探せるか", async () => {
      const repo = repoGene();

      const client = new Client(ObjectIDGenerator(),
        "name",
        "https://hoge.com",
        ObjectIDGenerator(),
        new Date(0),
        new Date(100));

      const user1 = ObjectIDGenerator();
      const user2 = ObjectIDGenerator();
      const user3 = ObjectIDGenerator();

      const client1 = client.copy({ id: ObjectIDGenerator(), user: user1, date: new Date(50) });
      const client2 = client.copy({ id: ObjectIDGenerator(), user: user1, date: new Date(80) });
      const client3 = client.copy({ id: ObjectIDGenerator(), user: user1, date: new Date(30) });
      const client4 = client.copy({ id: ObjectIDGenerator(), user: user2, date: new Date(90) });

      await repo.insert(client1);
      await repo.insert(client2);
      await repo.insert(client3);
      await repo.insert(client4);

      expect(await repo.findAll({
        id: ObjectIDGenerator(),
        key: "key",
        user: user1,
        type: "master"
      })).toEqual([
        client2,
        client1,
        client3,
      ]);

      expect(await repo.findAll({
        id: ObjectIDGenerator(),
        key: "key",
        user: user2,
        type: "master"
      })).toEqual([
        client4,
      ]);

      expect(await repo.findAll({
        id: ObjectIDGenerator(),
        key: "key",
        user: user3,
        type: "master"
      })).toEqual([]);
    });
  });

  describe("insert", () => {
    it("正常に保存出来るか", async () => {
      const repo = repoGene();

      const client = new Client(ObjectIDGenerator(),
        "name",
        "https://hoge.com",
        ObjectIDGenerator(),
        new Date(0),
        new Date(10));

      await repo.insert(client);

      expect(await repo.findOne(client.id)).toEqual(client);
    });

    //TODO:ID被り
  });

  describe("update", () => {
    it("正常に更新出来るか", async () => {
      const repo = repoGene();

      const client = new Client(ObjectIDGenerator(),
        "name",
        "https://hoge.com",
        ObjectIDGenerator(),
        new Date(0),
        new Date(10));

      const client1 = client.copy({ id: ObjectIDGenerator(), name: "client1" });
      const client2 = client.copy({ id: ObjectIDGenerator(), name: "client2" });
      const client1update = client.copy({ name: "update" });

      await repo.insert(client1);
      await repo.insert(client2);

      await repo.update(client1update);

      expect(await repo.findOne(client1.id)).toEqual(client1update);
      expect(await repo.findOne(client2.id)).toEqual(client2);
    });

    //TODO:存在しないID
  });
}

describe("ClientRepoMock", () => {
  run(() => new ClientRepoMock(), false);
});

describe("ClientRepo", () => {
  run(() => new ClientRepo(), true);
});
