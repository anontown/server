import {
  AtError,
  dbReset,
  IUserRepo,
  ObjectIDGenerator,
  ResWaitCountKey,
  User,
} from "../../";

export function run(repoGene: () => IUserRepo, isReset: boolean) {
  beforeEach(async () => {
    if (isReset) {
      await dbReset();
    }
  });

  const user = new User(ObjectIDGenerator(),
    "sn",
    "pass",
    1,
    {
      last: new Date(300),
      m10: 10,
      m30: 20,
      h1: 30,
      h6: 40,
      h12: 50,
      d1: 60,
    },
    new Date(100),
    new Date(0),
    0,
    new Date(200));

  describe("findOne", () => {
    it("正常に取得出来るか", async () => {
      const repo = repoGene();

      await repo.insert(user);
      await repo.insert(user.copy({ id: ObjectIDGenerator(), sn: "sn2" }));

      expect(await repo.findOne(user.id)).toEqual(user);
    });

    it("存在しない時エラーになるか", async () => {
      const repo = repoGene();

      await repo.insert(user);

      await expect(repo.findOne(ObjectIDGenerator())).rejects.toThrow(AtError);
    });
  });

  describe("findID", () => {
    it("正常に取得出来るか", async () => {
      const repo = repoGene();

      await repo.insert(user);
      await repo.insert(user.copy({ id: ObjectIDGenerator(), sn: "sn2" }));

      expect(await repo.findID(user.sn)).toEqual(user.id);
    });

    it("存在しない時エラーになるか", async () => {
      const repo = repoGene();

      await repo.insert(user);

      await expect(repo.findID("sn2")).rejects.toThrow(AtError);
    });
  });

  describe("insert", () => {
    it("正常に保存出来るか", async () => {
      const repo = repoGene();

      await repo.insert(user);

      expect(await repo.findOne(user.id)).toEqual(user);
    });

    it("スクリーンネーム被りでエラーになるか", async () => {
      const repo = repoGene();

      await repo.insert(user);

      await expect(repo.insert(user.copy({ id: ObjectIDGenerator() }))).rejects.toThrow(AtError);
    });
  });

  describe("update", () => {
    it("正常に更新出来るか", async () => {
      const repo = repoGene();

      const user1 = user.copy({ id: ObjectIDGenerator(), sn: "sn1" });
      const user2 = user.copy({ id: ObjectIDGenerator(), sn: "sn2" });
      const user1update = user1.copy({ sn: "update" });

      await repo.insert(user1);
      await repo.insert(user2);

      await repo.update(user1update);

      expect(await repo.findOne(user1.id)).toEqual(user1update);
      expect(await repo.findOne(user2.id)).toEqual(user2);
    });

    it("sn被りでエラーになるか", async () => {
      const repo = repoGene();

      const user1 = user.copy({ id: ObjectIDGenerator(), sn: "sn1" });
      const user2 = user.copy({ id: ObjectIDGenerator(), sn: "sn2" });
      const user1update = user1.copy({ sn: "sn2" });

      await repo.insert(user1);
      await repo.insert(user2);

      await expect(repo.update(user1update)).rejects.toThrow(AtError);
    });

    // TODO:存在しないID
  });

  describe("cronPointReset", () => {
    it("正常に更新出来るか", async () => {
      const repo = repoGene();

      const users = [
        user.copy({ id: ObjectIDGenerator(), sn: "sn1", point: 10 }),
        user.copy({ id: ObjectIDGenerator(), sn: "sn2", point: 0 }),
        user.copy({ id: ObjectIDGenerator(), sn: "sn3", point: 1 }),
      ];

      for (const u of users) {
        await repo.insert(u);
      }

      await repo.cronPointReset();

      for (const u of users) {
        expect(await repo.findOne(u.id)).toEqual(u.copy({ point: 0 }));
      }
    });
  });

  describe("cronCountReset", () => {
    for (const t of ["m10", "m30", "h1", "h6", "h12", "d1"] as ResWaitCountKey[]) {
      it("正常に更新出来るか:" + t, async () => {
        const repo = repoGene();

        const users = [
          user.copy({
            id: ObjectIDGenerator(), sn: "sn1", resWait: {
              last: new Date(310),
              m10: 0,
              m30: 10,
              h1: 20,
              h6: 0,
              h12: 30,
              d1: 40,
            },
          }),
          user.copy({
            id: ObjectIDGenerator(), sn: "sn2", resWait: {
              last: new Date(330),
              m10: 10,
              m30: 20,
              h1: 0,
              h6: 30,
              h12: 40,
              d1: 0,
            },
          }),
          user.copy({
            id: ObjectIDGenerator(), sn: "sn3", resWait: {
              last: new Date(320),
              m10: 20,
              m30: 0,
              h1: 10,
              h6: 40,
              h12: 0,
              d1: 30,
            },
          }),
        ];

        for (const u of users) {
          await repo.insert(u);
        }

        await repo.cronCountReset(t);

        for (const u of users) {
          expect(await repo.findOne(u.id)).toEqual(u.copy({ resWait: { ...u.resWait, [t]: 0 } }));
        }
      });
    }
  });
}
