import {
  AtError,
  dbReset,
  Storage,
  ObjectIDGenerator,
  StorageRepo,
  StorageRepoMock,
  IStorageRepo,
  IAuthTokenGeneral,
  IAuthTokenMaster
} from "../../";


function run(repoGene: () => IStorageRepo, isReset: boolean) {
  beforeEach(async () => {
    if (isReset) {
      await dbReset();
    }
  });

  describe("findOneKey", () => {
    it("正常に検索出来るか", async () => {
      const repo = repoGene();

      const storage = new Storage(ObjectIDGenerator(), null, ObjectIDGenerator(), "key", "value");

      const client1 = ObjectIDGenerator();
      const client2 = ObjectIDGenerator();

      const user1 = ObjectIDGenerator();
      const user2 = ObjectIDGenerator();

      const key1 = "key1";
      const key2 = "key2";

      const authGeneral: IAuthTokenGeneral = {
        id: ObjectIDGenerator(),
        key: "tk",
        user: user1,
        type: "general",
        client: client1
      };

      const authMaster: IAuthTokenMaster = {
        id: ObjectIDGenerator(),
        key: "tk",
        user: user1,
        type: "master",
      };

      const storage1 = storage.copy({
        id: ObjectIDGenerator(),
        client: null,
        user: user1,
        key: key1
      });

      const storage2 = storage.copy({
        id: ObjectIDGenerator(),
        client: null,
        user: user1,
        key: key2
      });

      const storage3 = storage.copy({
        id: ObjectIDGenerator(),
        client: null,
        user: user2,
        key: key1
      });

      const storage4 = storage.copy({
        id: ObjectIDGenerator(),
        client: client1,
        user: user1,
        key: key1
      });

      const storage5 = storage.copy({
        id: ObjectIDGenerator(),
        client: client1,
        user: user1,
        key: key2
      });

      const storage6 = storage.copy({
        id: ObjectIDGenerator(),
        client: client1,
        user: user2,
        key: key1
      });

      const storage7 = storage.copy({
        id: ObjectIDGenerator(),
        client: client2,
        user: user1,
        key: key1
      });

      await repo.save(storage1);
      await repo.save(storage2);
      await repo.save(storage3);
      await repo.save(storage4);
      await repo.save(storage5);
      await repo.save(storage6);
      await repo.save(storage7);

      expect(await repo.findOneKey(authMaster, key1)).toEqual(storage1);
      expect(await repo.findOneKey(authGeneral, key1)).toEqual(storage4);
    });

    it("存在しない時エラーになるか(通常トークン)", async () => {
      const repo = repoGene();

      const client = ObjectIDGenerator();
      const user = ObjectIDGenerator();
      const key = "key";

      const authGeneral: IAuthTokenGeneral = {
        id: ObjectIDGenerator(),
        key: "tk",
        user: user,
        type: "general",
        client: client
      };

      const authMaster: IAuthTokenMaster = {
        id: ObjectIDGenerator(),
        key: "tk",
        user: user,
        type: "master",
      };

      const storage = new Storage(ObjectIDGenerator(), client, user, key, "value");

      await repo.save(storage);

      await expect(repo.findOneKey({ ...authGeneral, user: ObjectIDGenerator() }, key)).rejects.toThrow(AtError);
      await expect(repo.findOneKey({ ...authGeneral, client: ObjectIDGenerator() }, key)).rejects.toThrow(AtError);
      await expect(repo.findOneKey(authGeneral, "key2")).rejects.toThrow(AtError);
      await expect(repo.findOneKey(authMaster, key)).rejects.toThrow(AtError);
    });
  });
}

describe("StorageRepoMock", () => {
  run(() => new StorageRepoMock(), false);
});

describe("StorageRepo", () => {
  run(() => new StorageRepo(), true);
});
