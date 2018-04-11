import * as Im from "immutable";
import {
  AtError,
  dbReset,
  ITokenRepo,
  ObjectIDGenerator,
  TokenGeneral,
  TokenMaster,
  TokenRepo,
  TokenRepoMock,
} from "../../";

function run(repoGene: () => ITokenRepo, isReset: boolean) {
  beforeEach(async () => {
    if (isReset) {
      await dbReset();
    }
  });

  const userID = ObjectIDGenerator();

  const tokenMaster = new TokenMaster(ObjectIDGenerator(),
    "key",
    userID,
    new Date(0));

  const tokenGeneral = new TokenGeneral(ObjectIDGenerator(),
    "key",
    ObjectIDGenerator(),
    userID,
    Im.List(),
    new Date(0));

  describe("findOne", () => {
    it("正常に探せるか", async () => {
      const repo = repoGene();

      await repo.insert(tokenMaster);
      await repo.insert(tokenGeneral);

      expect(await repo.findOne(tokenMaster.id)).toEqual(tokenMaster);
      expect(await repo.findOne(tokenGeneral.id)).toEqual(tokenGeneral);
    });

    it("存在しない時エラーになるか", async () => {
      const repo = repoGene();

      await repo.insert(tokenMaster);

      await expect(repo.findOne(ObjectIDGenerator())).rejects.toThrow(AtError);
    });
  });

  describe("findAll", () => {
    it("正常に探せるか", async () => {
      const repo = repoGene();

      const user1 = ObjectIDGenerator();
      const user2 = ObjectIDGenerator();
      const user3 = ObjectIDGenerator();

      const token1 = tokenMaster.copy({ id: ObjectIDGenerator(), user: user1, date: new Date(50) });
      const token2 = tokenGeneral.copy({ id: ObjectIDGenerator(), user: user1, date: new Date(80) });
      const token3 = tokenMaster.copy({ id: ObjectIDGenerator(), user: user1, date: new Date(30) });
      const token4 = tokenGeneral.copy({ id: ObjectIDGenerator(), user: user2, date: new Date(90) });

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

      await repo.insert(tokenMaster);

      expect(await repo.findOne(tokenMaster.id)).toEqual(tokenMaster);
    });

    // TODO:ID被り
  });

  describe("update", () => {
    it("正常に更新出来るか", async () => {
      const repo = repoGene();

      const token1 = tokenMaster.copy({ id: ObjectIDGenerator(), key: "key1" });
      const token2 = tokenGeneral.copy({ id: ObjectIDGenerator(), key: "key2" });
      const token1update = token1.copy({ key: "update" });
      const token2update = token2.copy({ key: "update" });

      await repo.insert(token1);
      await repo.insert(token2);

      await repo.update(token1update);

      expect(await repo.findOne(token2.id)).toEqual(token2);

      await repo.update(token2update);

      expect(await repo.findOne(token1.id)).toEqual(token1update);
      expect(await repo.findOne(token2.id)).toEqual(token2update);
    });

    // TODO:存在しないID
  });

  describe("delClientToken", () => {
    it("正常に削除出来るか", async () => {
      const repo = repoGene();

      const token1 = tokenGeneral.copy({ id: ObjectIDGenerator() });
      const token2 = tokenGeneral.copy({ id: ObjectIDGenerator() });
      const token3 = tokenGeneral.copy({ id: ObjectIDGenerator(), client: ObjectIDGenerator() });
      const token4 = tokenGeneral.copy({ id: ObjectIDGenerator(), user: ObjectIDGenerator() });
      const token5 = tokenMaster.copy({ id: ObjectIDGenerator() });

      await repo.insert(token1);
      await repo.insert(token2);
      await repo.insert(token3);
      await repo.insert(token4);
      await repo.insert(token5);

      await repo.delClientToken({
        id: ObjectIDGenerator(),
        key: "key",
        user: tokenGeneral.user,
        type: "master",
      }, tokenGeneral.client);

      await expect(repo.findOne(token1.id)).rejects.toThrow(AtError);
      await expect(repo.findOne(token2.id)).rejects.toThrow(AtError);
      expect(await repo.findOne(token3.id)).toEqual(token3);
      expect(await repo.findOne(token4.id)).toEqual(token4);
      expect(await repo.findOne(token5.id)).toEqual(token5);
    });
  });

  describe("delMasterToken", () => {
    it("正常に削除出来るか", async () => {
      const repo = repoGene();

      const token1 = tokenMaster.copy({ id: ObjectIDGenerator() });
      const token2 = tokenMaster.copy({ id: ObjectIDGenerator() });
      const token3 = tokenMaster.copy({ id: ObjectIDGenerator(), user: ObjectIDGenerator() });
      const token4 = tokenGeneral.copy({ id: ObjectIDGenerator() });

      await repo.insert(token1);
      await repo.insert(token2);
      await repo.insert(token3);
      await repo.insert(token4);

      await repo.delMasterToken({
        id: token1.user,
        pass: "pass",
      });

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
