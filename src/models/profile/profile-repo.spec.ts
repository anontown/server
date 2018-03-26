import {
  AtError,
  Profile,
  ProfileRepo,
  ProfileRepoMock,
  dbReset,
  IProfileRepo,
  ObjectIDGenerator,
} from "../../";

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
        "user",
        "name",
        "body",
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
        "user",
        "name",
        "body",
        new Date(0),
        new Date(10),
        "sn"));

      await expect(repo.findOne(ObjectIDGenerator())).rejects.toThrow(AtError);
    });
  });
}

describe("ProfileRepoMock", () => {
  run(() => new ProfileRepoMock(), false);
});

describe("ProfileRepo", () => {
  run(() => new ProfileRepo(), true);
});
