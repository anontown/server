import {
  AtError,
  dbReset,
  IProfileRepo,
  ObjectIDGenerator,
  Profile,
  ProfileRepo,
  ProfileRepoMock,
} from "../../";
import { AuthContainer } from "../../server/auth-container";

function run(repoGene: () => IProfileRepo, isReset: boolean) {
  beforeEach(async () => {
    if (isReset) {
      await dbReset();
    }
  });
  describe("findOne", () => {
    it("正常に探せるか", async () => {
      const repo = repoGene();

      const profile = new Profile(ObjectIDGenerator(),
        ObjectIDGenerator(),
        "name",
        "text",
        new Date(0),
        new Date(10),
        "sn");

      await repo.insert(profile);
      await repo.insert(profile.copy({ id: ObjectIDGenerator(), sn: "sn2" }));

      expect(await repo.findOne(profile.id)).toEqual(profile);
    });

    it("存在しない時エラーになるか", async () => {
      const repo = repoGene();

      await repo.insert(new Profile(ObjectIDGenerator(),
        ObjectIDGenerator(),
        "name",
        "text",
        new Date(0),
        new Date(10),
        "sn"));

      await expect(repo.findOne(ObjectIDGenerator())).rejects.toThrow(AtError);
    });
  });

  describe("findIn", () => {
    it("正常に探せるか", async () => {
      const repo = repoGene();

      const profile = new Profile(ObjectIDGenerator(),
        ObjectIDGenerator(),
        "name",
        "text",
        new Date(0),
        new Date(10),
        "sn");

      const profile1 = profile.copy({ id: ObjectIDGenerator(), date: new Date(50), sn: "sn1" });
      const profile2 = profile.copy({ id: ObjectIDGenerator(), date: new Date(80), sn: "sn2" });
      const profile3 = profile.copy({ id: ObjectIDGenerator(), date: new Date(30), sn: "sn3" });
      const profile4 = profile.copy({ id: ObjectIDGenerator(), date: new Date(90), sn: "sn4" });

      await repo.insert(profile1);
      await repo.insert(profile2);
      await repo.insert(profile3);
      await repo.insert(profile4);

      expect(await repo.findIn([
        profile1.id,
        profile2.id,
        profile3.id,
      ])).toEqual([
        profile2,
        profile1,
        profile3,
      ]);

      expect(await repo.findIn([])).toEqual([]);
    });

    it("存在しない物がある時エラーになるか", async () => {
      const repo = repoGene();

      const profile = new Profile(ObjectIDGenerator(),
        ObjectIDGenerator(),
        "name",
        "text",
        new Date(0),
        new Date(10),
        "sn");

      await repo.insert(profile);

      await expect(repo.findIn([ObjectIDGenerator()])).rejects.toThrow(AtError);
      await expect(repo.findIn([ObjectIDGenerator(), profile.id])).rejects.toThrow(AtError);
    });
  });

  describe("findAll", () => {
    it("正常に探せるか", async () => {
      const repo = repoGene();

      const profile = new Profile(ObjectIDGenerator(),
        ObjectIDGenerator(),
        "name",
        "text",
        new Date(0),
        new Date(10),
        "sn");

      const user1 = ObjectIDGenerator();
      const user2 = ObjectIDGenerator();
      const user3 = ObjectIDGenerator();

      const profile1 = profile.copy({ id: ObjectIDGenerator(), user: user1, date: new Date(50), sn: "sn1" });
      const profile2 = profile.copy({ id: ObjectIDGenerator(), user: user1, date: new Date(80), sn: "sn2" });
      const profile3 = profile.copy({ id: ObjectIDGenerator(), user: user1, date: new Date(30), sn: "sn3" });
      const profile4 = profile.copy({ id: ObjectIDGenerator(), user: user2, date: new Date(90), sn: "sn4" });

      await repo.insert(profile1);
      await repo.insert(profile2);
      await repo.insert(profile3);
      await repo.insert(profile4);

      expect(await repo.findAll({
        id: ObjectIDGenerator(),
        key: "key",
        user: user1,
        type: "master",
      })).toEqual([
        profile2,
        profile1,
        profile3,
      ]);

      expect(await repo.findAll({
        id: ObjectIDGenerator(),
        key: "key",
        user: user2,
        type: "master",
      })).toEqual([
        profile4,
      ]);

      expect(await repo.findAll({
        id: ObjectIDGenerator(),
        key: "key",
        user: user3,
        type: "master",
      })).toEqual([]);
    });
  });

  describe("find", () => {
    it("正常に探せるか", async () => {
      const repo = repoGene();

      const profile = new Profile(ObjectIDGenerator(),
        ObjectIDGenerator(),
        "name",
        "text",
        new Date(0),
        new Date(10),
        "sn");

      const user1 = ObjectIDGenerator();
      const user2 = ObjectIDGenerator();
      const user3 = ObjectIDGenerator();

      const profile1 = profile.copy({ id: ObjectIDGenerator(), user: user1, date: new Date(50), sn: "sn1" });
      const profile2 = profile.copy({ id: ObjectIDGenerator(), user: user1, date: new Date(80), sn: "sn2" });
      const profile3 = profile.copy({ id: ObjectIDGenerator(), user: user1, date: new Date(30), sn: "sn3" });
      const profile4 = profile.copy({ id: ObjectIDGenerator(), user: user2, date: new Date(90), sn: "sn4" });

      await repo.insert(profile1);
      await repo.insert(profile2);
      await repo.insert(profile3);
      await repo.insert(profile4);

      expect(await repo.find(new AuthContainer(null, null, false), {})).toEqual([
        profile4,
        profile2,
        profile1,
        profile3,
      ]);

      expect(await repo.find(new AuthContainer({
        id: ObjectIDGenerator(),
        key: "key",
        user: user1,
        type: "master",
      }, null, false), { self: true })).toEqual([
        profile2,
        profile1,
        profile3,
      ]);

      expect(await repo.find(new AuthContainer({
        id: ObjectIDGenerator(),
        key: "key",
        user: user2,
        type: "master",
      }, null, false), { self: true })).toEqual([
        profile4,
      ]);

      expect(await repo.find(new AuthContainer({
        id: ObjectIDGenerator(),
        key: "key",
        user: user3,
        type: "master",
      }, null, false), { self: true })).toEqual([]);

      expect(await repo.find(new AuthContainer(null, null, false), { id: [] })).toEqual([]);
      expect(await repo.find(new AuthContainer(null, null, false),
        { id: [profile1.id, profile2.id, ObjectIDGenerator()] })).toEqual([
          profile2,
          profile1,
        ]);

      expect(await repo.find(new AuthContainer({
        id: ObjectIDGenerator(),
        key: "key",
        user: user1,
        type: "master",
      }, null, false), { self: true, id: [profile1.id, profile2.id, profile4.id] })).toEqual([
        profile2,
        profile1,
      ]);
    });

    it("認証していない状態でselfしたらエラーになるか", async () => {
      const repo = repoGene();

      await expect(repo.find(new AuthContainer(null, null, false),
        { self: true })).rejects.toThrow(AtError);
    });
  });

  describe("insert", () => {
    it("正常に保存出来るか", async () => {
      const repo = repoGene();

      const profile = new Profile(ObjectIDGenerator(),
        ObjectIDGenerator(),
        "name",
        "text",
        new Date(0),
        new Date(10),
        "sn");

      await repo.insert(profile);

      expect(await repo.findOne(profile.id)).toEqual(profile);
    });

    it("sn被りでエラーになるか", async () => {
      const repo = repoGene();

      const profile = new Profile(ObjectIDGenerator(),
        ObjectIDGenerator(),
        "name",
        "text",
        new Date(0),
        new Date(10),
        "sn");

      const profile2 = profile.copy({ id: ObjectIDGenerator() });

      await repo.insert(profile);
      await expect(repo.insert(profile2)).rejects.toThrow(AtError);
    });

    // TODO:ID被り
  });

  describe("update", () => {
    it("正常に更新出来るか", async () => {
      const repo = repoGene();

      const profile = new Profile(ObjectIDGenerator(),
        ObjectIDGenerator(),
        "name",
        "text",
        new Date(0),
        new Date(10),
        "sn");

      const profile1 = profile.copy({ id: ObjectIDGenerator(), sn: "sn1" });
      const profile2 = profile.copy({ id: ObjectIDGenerator(), sn: "sn2" });
      const profile1update = profile1.copy({ sn: "update" });
      const profile1update2 = profile1.copy({ name: "newname" });

      await repo.insert(profile1);
      await repo.insert(profile2);

      await repo.update(profile1update);

      expect(await repo.findOne(profile1.id)).toEqual(profile1update);
      expect(await repo.findOne(profile2.id)).toEqual(profile2);

      await repo.update(profile1update2);
      expect(await repo.findOne(profile1.id)).toEqual(profile1update2);
    });

    it("sn被りでエラーになるか", async () => {
      const repo = repoGene();

      const profile = new Profile(ObjectIDGenerator(),
        ObjectIDGenerator(),
        "name",
        "text",
        new Date(0),
        new Date(10),
        "sn");

      const profile1 = profile.copy({ id: ObjectIDGenerator(), sn: "sn1" });
      const profile2 = profile.copy({ id: ObjectIDGenerator(), sn: "sn2" });
      const profile1update = profile1.copy({ sn: "sn2" });

      await repo.insert(profile1);
      await repo.insert(profile2);

      await expect(repo.update(profile1update)).rejects.toThrow(AtError);
    });

    // TODO:存在しないID
  });
}

describe("ProfileRepoMock", () => {
  run(() => new ProfileRepoMock(), false);
});

describe("ProfileRepo", () => {
  run(() => new ProfileRepo(), true);
});
