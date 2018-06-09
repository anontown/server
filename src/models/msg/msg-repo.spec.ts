import {
  AtError,
  dbReset,
  IAuthTokenMaster,
  IMsgRepo,
  Msg,
  MsgRepo,
  MsgRepoMock,
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
        "text",
        new Date(0));

      await repo.insert(msg);
      await repo.insert(msg.copy({ id: "msg2" }));

      expect(await repo.findOne(msg.id)).toEqual(msg);
    });

    it("存在しない時エラーになるか", async () => {
      const repo = repoGene();

      await repo.insert(new Msg("msg",
        "user",
        "text",
        new Date(0)));

      await expect(repo.findOne("msg2")).rejects.toThrow(AtError);
    });
  });

  describe("findIn", () => {
    it("正常に探せるか", async () => {
      const repo = repoGene();

      const msg = new Msg("msg",
        "user",
        "text",
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
        "text",
        new Date(0));

      await repo.insert(msg);

      await expect(repo.findIn(["msg2"])).rejects.toThrow(AtError);
      await expect(repo.findIn(["msg2", msg.id])).rejects.toThrow(AtError);
    });
  });

  describe("find", () => {
    it("正常に検索出来るか", async () => {
      const repo = repoGene();

      const msg = new Msg("msg",
        "user",
        "text",
        new Date(0));

      const user1 = "user1";
      const user2 = "user2";

      const token: IAuthTokenMaster = {
        id: "token",
        key: "key",
        user: user1,
        type: "master",
      };

      const msg1 = msg.copy({ id: "msg1", date: new Date(50), receiver: null });
      const msg2 = msg.copy({ id: "msg2", date: new Date(80), receiver: user2 });
      const msg3 = msg.copy({ id: "msg3", date: new Date(30), receiver: user1 });
      const msg4 = msg.copy({ id: "msg4", date: new Date(90), receiver: user1 });
      const msg5 = msg.copy({ id: "msg5", date: new Date(20), receiver: user1 });
      const msg6 = msg.copy({ id: "msg6", date: new Date(10), receiver: user1 });
      const msg7 = msg.copy({ id: "msg7", date: new Date(60), receiver: user1 });
      const msg8 = msg.copy({ id: "msg8", date: new Date(40), receiver: user1 });
      const msg9 = msg.copy({ id: "msg9", date: new Date(70), receiver: user1 });

      await repo.insert(msg1);
      await repo.insert(msg2);
      await repo.insert(msg3);
      await repo.insert(msg4);
      await repo.insert(msg5);
      await repo.insert(msg6);
      await repo.insert(msg7);
      await repo.insert(msg8);
      await repo.insert(msg9);

      expect(await repo.find(token, "gte", new Date(0), 100)).toEqual([
        msg4,
        msg9,
        msg7,
        msg1,
        msg8,
        msg3,
        msg5,
        msg6,
      ]);

      expect(await repo.find(token, "gte", new Date(70), 100)).toEqual([
        msg4,
        msg9,
      ]);

      expect(await repo.find(token, "gte", new Date(70), 1)).toEqual([
        msg9,
      ]);

      expect(await repo.find(token, "gt", new Date(70), 100)).toEqual([
        msg4,
      ]);

      expect(await repo.find(token, "lte", new Date(30), 100)).toEqual([
        msg3,
        msg5,
        msg6,
      ]);

      expect(await repo.find(token, "lte", new Date(30), 2)).toEqual([
        msg3,
        msg5,
      ]);

      expect(await repo.find(token, "lt", new Date(30), 100)).toEqual([
        msg5,
        msg6,
      ]);

      expect(await repo.find(token, "gt", new Date(90), 100)).toEqual([]);
      expect(await repo.find(token, "lt", new Date(30), 0)).toEqual([]);
    });
  });

  describe("insert", () => {
    it("正常に保存出来るか", async () => {
      const repo = repoGene();

      const msg = new Msg("msg",
        "user",
        "text",
        new Date(0));

      await repo.insert(msg);

      expect(await repo.findOne(msg.id)).toEqual(msg);
    });

    // TODO:ID被り
  });

  describe("update", () => {
    it("正常に更新出来るか", async () => {
      const repo = repoGene();

      const msg = new Msg("msg",
        "user",
        "text",
        new Date(0));

      const msg1 = msg.copy({ id: "msg1" });
      const msg2 = msg.copy({ id: "msg2" });
      const msg1update = msg1.copy({ text: "update" });

      await repo.insert(msg1);
      await repo.insert(msg2);

      await repo.update(msg1update);

      expect(await repo.findOne(msg1.id)).toEqual(msg1update);
      expect(await repo.findOne(msg2.id)).toEqual(msg2);
    });

    // TODO:存在しないID
  });
}

describe("MsgRepoMock", () => {
  run(() => new MsgRepoMock(), false);
});

describe("MsgRepo", () => {
  run(() => new MsgRepo(true), true);
});
