import {
  AtError,
  Client,
  dbReset,
  IClientRepo,
  ObjectIDGenerator,
} from "../../";

export function run(repoGene: () => IClientRepo, isReset: boolean) {
  const client = new Client(ObjectIDGenerator(),
    "name",
    "https://hoge.com",
    ObjectIDGenerator(),
    new Date(0),
    new Date(100));

  beforeEach(async () => {
    if (isReset) {
      await dbReset();
    }
  });
  describe("findOne", () => {
    it("正常に探せるか", async () => {
      const repo = repoGene();

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

  describe("find", () => {
    it("正常に検索出来るか", async () => {
      const repo = repoGene();

      const user1 = ObjectIDGenerator();
      const user2 = ObjectIDGenerator();

      const client1 = client.copy({ id: ObjectIDGenerator(), user: user1, date: new Date(50) });
      const client2 = client.copy({ id: ObjectIDGenerator(), user: user1, date: new Date(80) });
      const client3 = client.copy({ id: ObjectIDGenerator(), user: user1, date: new Date(30) });
      const client4 = client.copy({ id: ObjectIDGenerator(), user: user2, date: new Date(90) });

      await repo.insert(client1);
      await repo.insert(client2);
      await repo.insert(client3);
      await repo.insert(client4);

      // 無

      expect(await repo.find(null, {})).toEqual([
        client4,
        client2,
        client1,
        client3,
      ]);

      // id

      expect(await repo.find(null, {
        id: [],
      })).toEqual([]);

      expect(await repo.find(null, {
        id: [client1.id],
      })).toEqual([client1]);

      expect(await repo.find(null, {
        id: [client1.id, ObjectIDGenerator()],
      })).toEqual([client1]);

      // self

      expect(await repo.find(null, { self: false })).toEqual([
        client4,
        client2,
        client1,
        client3,
      ]);

      expect(await repo.find({
        id: ObjectIDGenerator(),
        key: "key",
        user: user1,
        type: "master",
      }, { self: true })).toEqual([
        client2,
        client1,
        client3,
      ]);

      // 複合
      expect(await repo.find({
        id: ObjectIDGenerator(),
        key: "key",
        user: user1,
        type: "master",
      }, { self: true, id: [client1.id, client4.id] })).toEqual([
        client1,
      ]);
    });

    describe("トークンがnullでselfがtrueの時エラーになるか", async () => {
      const repo = repoGene();
      await expect(repo.find(null, { self: true })).rejects.toThrow(AtError);
    });
  });

  describe("insert", () => {
    it("正常に保存出来るか", async () => {
      const repo = repoGene();

      await repo.insert(client);

      expect(await repo.findOne(client.id)).toEqual(client);
    });

    // TODO:ID被り
  });

  describe("update", () => {
    it("正常に更新出来るか", async () => {
      const repo = repoGene();

      const client1 = client.copy({ id: ObjectIDGenerator(), name: "client1" });
      const client2 = client.copy({ id: ObjectIDGenerator(), name: "client2" });
      const client1update = client1.copy({ name: "update" });

      await repo.insert(client1);
      await repo.insert(client2);

      await repo.update(client1update);

      expect(await repo.findOne(client1.id)).toEqual(client1update);
      expect(await repo.findOne(client2.id)).toEqual(client2);
    });

    // TODO:存在しないID
  });
}
