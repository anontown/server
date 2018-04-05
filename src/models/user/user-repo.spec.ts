import {
  AtError,
  dbReset,
  ObjectIDGenerator,
  UserRepo,
  UserRepoMock,
  IUserRepo,
  User,
} from "../../";

function run(repoGene: () => IUserRepo, isReset: boolean) {
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
      await repo.insert(user.copy({ id: ObjectIDGenerator() }));

      expect(await repo.findOne(user.id)).toEqual(user);
    });

    it("存在しない時エラーになるか", async () => {
      const repo = repoGene();

      await repo.insert(user);

      await expect(repo.findOne(ObjectIDGenerator())).rejects.toThrow(AtError);
    });
  });
}

describe("UserRepoMock", () => {
  run(() => new UserRepoMock(), false);
});

describe("UserRepo", () => {
  run(() => new UserRepo(), true);
});
