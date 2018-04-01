import {
  AtError,
  dbReset,
  ITokenRepo,
  ObjectIDGenerator,
  TokenMaster,
  TokenRepo,
  TokenRepoMock,
  TokenGeneral,
} from "../../";
import * as Im from "immutable";


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

  describe("findAll", () => {
    it("正常に探せるか", async () => {
      const repo = repoGene();

      const token = new TokenMaster(ObjectIDGenerator(),
        "key",
        ObjectIDGenerator(),
        new Date(0));

      const user1 = ObjectIDGenerator();
      const user2 = ObjectIDGenerator();
      const user3 = ObjectIDGenerator();

      const token1 = token.copy({ id: ObjectIDGenerator(), user: user1, date: new Date(50) });
      const token2 = token.copy({ id: ObjectIDGenerator(), user: user1, date: new Date(80) });
      const token3 = token.copy({ id: ObjectIDGenerator(), user: user1, date: new Date(30) });
      const token4 = token.copy({ id: ObjectIDGenerator(), user: user2, date: new Date(90) });

      await repo.insert(token1);
      await repo.insert(token2);
      await repo.insert(token3);
      await repo.insert(token4);

      expect(await repo.findAll({
        id: ObjectIDGenerator(),
        key: "key",
        user: user1,
        type: "master",
      })).toEqual([
        token2,
        token1,
        token3,
      ]);

      expect(await repo.findAll({
        id: ObjectIDGenerator(),
        key: "key",
        user: user2,
        type: "master",
      })).toEqual([
        token4,
      ]);

      expect(await repo.findAll({
        id: ObjectIDGenerator(),
        key: "key",
        user: user3,
        type: "master",
      })).toEqual([]);
    });
  });

  describe("insert", () => {
    it("正常に保存出来るか", async () => {
      const repo = repoGene();

      const token = new TokenMaster(ObjectIDGenerator(),
        "key",
        ObjectIDGenerator(),
        new Date(0));

      await repo.insert(token);

      expect(await repo.findOne(token.id)).toEqual(token);
    });

    // TODO:ID被り
  });

  describe("update", () => {
    it("正常に更新出来るか", async () => {
      const repo = repoGene();

      const token = new TokenMaster(ObjectIDGenerator(),
        "key",
        ObjectIDGenerator(),
        new Date(0));

      const token1 = token.copy({ id: ObjectIDGenerator(), key: "key1" });
      const token2 = token.copy({ id: ObjectIDGenerator(), key: "key2" });
      const token1update = token1.copy({ key: "update" });

      await repo.insert(token1);
      await repo.insert(token2);

      await repo.update(token1update);

      expect(await repo.findOne(token1.id)).toEqual(token1update);
      expect(await repo.findOne(token2.id)).toEqual(token2);
    });

    // TODO:存在しないID
  });

  describe("delClientToken", () => {
    it("正常に削除出来るか", async () => {
      const repo = repoGene();

      const token = new TokenGeneral(ObjectIDGenerator(),
        "key",
        ObjectIDGenerator(),
        ObjectIDGenerator(),
        Im.List(),
        new Date(0));

      const token1 = token.copy({ id: ObjectIDGenerator() });
      const token2 = token.copy({ id: ObjectIDGenerator() });
      const token3 = token.copy({ id: ObjectIDGenerator(), client: ObjectIDGenerator() });
      const token4 = token.copy({ id: ObjectIDGenerator(), user: ObjectIDGenerator() });

      await repo.insert(token1);
      await repo.insert(token2);
      await repo.insert(token3);
      await repo.insert(token4);

      await expect(repo.findOne(token1.id)).rejects.toThrow(AtError);
      await expect(repo.findOne(token2.id)).rejects.toThrow(AtError);
      expect(await repo.findOne(token3.id)).toEqual(token3);
      expect(await repo.findOne(token4.id)).toEqual(token4);
    });
  });
}

describe("TokenRepoMock", () => {
  run(() => new TokenRepoMock(), false);
});

describe("TokenRepo", () => {
  run(() => new TokenRepo(), true);
});
