import {
  AtError,
  Msg,
  MsgRepo,
  MsgRepoMock,
  dbReset,
  IMsgRepo,
} from "../../";
import * as Im from "immutable";

function run(repoGene: () => IMsgRepo, isReset: boolean) {
  beforeEach(async () => {
    if (isReset) {
      await dbReset();
    }
  });
  describe("findOne", () => {
    it("正常に探せるか", async () => {
      const repo = repoGene();

      /*
      readonly id: string,
    readonly receiver: string | null,
    readonly body: string,
    readonly date: Date
      */
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
}

describe("MsgRepoMock", () => {
  run(() => new MsgRepoMock(), false);
});

describe("MsgRepo", () => {
  run(() => new MsgRepo(true), true);
});
