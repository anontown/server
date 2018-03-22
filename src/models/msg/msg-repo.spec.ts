import {
  AtError,
  Msg,
  MsgRepo,
  MsgRepoMock,
  dbReset,
  IMsgRepo,
} from "../../";

function run(repoGene: () => IMsgRepo, isReset: boolean) {
  beforeEach(async () => {
    if (isReset) {
      await dbReset();
    }
  });
  describe("findOne", () => {
    it("正常に探せるか", async () => {
      const repo = repoGene();

      const msg = new Msg("msg",
        "user",
        "body",
        new Date(0));

      await repo.insert(msg);
      await repo.insert(msg.copy({ id: "msg2" }));

      expect(await repo.findOne(msg.id)).toEqual(msg);
    });

    it("存在しない時エラーになるか", async () => {
      const repo = repoGene();

      await repo.insert(new Msg("msg",
        "user",
        "body",
        new Date(0)));

      await expect(repo.findOne("msg2")).rejects.toThrow(AtError);
    });
  });

  describe("findIn", () => {
    it("正常に探せるか", async () => {
      const repo = repoGene();

      const msg = new Msg("msg",
        "user",
        "body",
        new Date(0));

      const msg1 = msg.copy({ id: "msg1", date: new Date(50) });
      const msg2 = msg.copy({ id: "msg2", date: new Date(80) });
      const msg3 = msg.copy({ id: "msg3", date: new Date(30) });
      const msg4 = msg.copy({ id: "msg4", date: new Date(90) });

      await repo.insert(msg1);
      await repo.insert(msg2);
      await repo.insert(msg3);
      await repo.insert(msg4);

      expect(await repo.findIn([
        msg1.id,
        msg2.id,
        msg3.id,
      ])).toEqual([
        msg2,
        msg1,
        msg3,
      ]);

      expect(await repo.findIn([])).toEqual([]);
    });

    it("存在しない物がある時エラーになるか", async () => {
      const repo = repoGene();

      const msg = new Msg("msg",
        "user",
        "body",
        new Date(0));

      await repo.insert(msg);

      await expect(repo.findIn(["msg2"])).rejects.toThrow(AtError);
      await expect(repo.findIn(["msg2", msg.id])).rejects.toThrow(AtError);
    });
  });
}

describe("MsgRepoMock", () => {
  run(() => new MsgRepoMock(), false);
});

describe("MsgRepo", () => {
  run(() => new MsgRepo(true), true);
});
