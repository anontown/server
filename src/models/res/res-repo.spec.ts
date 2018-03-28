import * as Im from "immutable";
import {
  AtError,
  dbReset,
  IResRepo,
  ResNormal,
  ResRepo,
  ResRepoMock,
  IAuthTokenMaster,
} from "../../";

function run(repoGene: () => IResRepo, isReset: boolean) {
  beforeEach(async () => {
    if (isReset) {
      await dbReset();
    }
  });

  describe("findOne", () => {
    it("正常に探せるか", async () => {
      const repo = repoGene();

      const res = new ResNormal("name",
        "body",
        null,
        "active",
        null,
        true,
        "res",
        "topic",
        new Date(0),
        "user",
        Im.List(),
        5,
        "hash",
        0,
      );

      await repo.insert(res);
      await repo.insert(res.copy({ id: "res2" }));

      expect(await repo.findOne(res.id)).toEqual(res);
    });

    it("存在しない時エラーになるか", async () => {
      const repo = repoGene();

      await repo.insert(new ResNormal("name",
        "body",
        null,
        "active",
        null,
        true,
        "res",
        "topic",
        new Date(0),
        "user",
        Im.List(),
        5,
        "hash",
        0,
      ));

      await expect(repo.findOne("res2")).rejects.toThrow(AtError);
    });
  });

  describe("findIn", () => {
    it("正常に探せるか", async () => {
      const repo = repoGene();

      const res = new ResNormal("name",
        "body",
        null,
        "active",
        null,
        true,
        "res",
        "topic",
        new Date(0),
        "user",
        Im.List(),
        5,
        "hash",
        0,
      );

      const res1 = res.copy({ id: "res1", date: new Date(50) });
      const res2 = res.copy({ id: "res2", date: new Date(80) });
      const res3 = res.copy({ id: "res3", date: new Date(30) });
      const res4 = res.copy({ id: "res4", date: new Date(90) });

      await repo.insert(res1);
      await repo.insert(res2);
      await repo.insert(res3);
      await repo.insert(res4);

      expect(await repo.findIn([
        res1.id,
        res2.id,
        res3.id,
      ])).toEqual([
        res2,
        res1,
        res3,
      ]);

      expect(await repo.findIn([])).toEqual([]);
    });

    it("存在しない物がある時エラーになるか", async () => {
      const repo = repoGene();

      const res = new ResNormal("name",
        "body",
        null,
        "active",
        null,
        true,
        "res",
        "topic",
        new Date(0),
        "user",
        Im.List(),
        5,
        "hash",
        0,
      );

      await repo.insert(res);

      await expect(repo.findIn(["res2"])).rejects.toThrow(AtError);
      await expect(repo.findIn(["res2", res.id])).rejects.toThrow(AtError);
    });
  });

  describe("find", () => {
    it("正常に検索出来るか", async () => {
      const repo = repoGene();

      const res = new ResNormal("name",
        "body",
        null,
        "active",
        null,
        true,
        "res",
        "topic",
        new Date(0),
        "user",
        Im.List(),
        5,
        "hash",
        0,
      );

      const res1 = res.copy({ id: "res1", date: new Date(50) });
      const res2 = res.copy({ id: "res2", date: new Date(80), topic: "topic2" });
      const res3 = res.copy({ id: "res3", date: new Date(30) });
      const res4 = res.copy({ id: "res4", date: new Date(90) });
      const res5 = res.copy({ id: "res5", date: new Date(20) });
      const res6 = res.copy({ id: "res6", date: new Date(10) });
      const res7 = res.copy({ id: "res7", date: new Date(60) });
      const res8 = res.copy({ id: "res8", date: new Date(40) });
      const res9 = res.copy({ id: "res9", date: new Date(70) });

      await repo.insert(res1);
      await repo.insert(res2);
      await repo.insert(res3);
      await repo.insert(res4);
      await repo.insert(res5);
      await repo.insert(res6);
      await repo.insert(res7);
      await repo.insert(res8);
      await repo.insert(res9);

      expect(await repo.find("topic", "after", true, new Date(0), 100)).toEqual([
        res4,
        res9,
        res7,
        res1,
        res8,
        res3,
        res5,
        res6,
      ]);

      expect(await repo.find("topic", "after", true, new Date(70), 100)).toEqual([
        res4,
        res9,
      ]);

      expect(await repo.find("topic", "after", true, new Date(70), 1)).toEqual([
        res9,
      ]);

      expect(await repo.find("topic", "after", false, new Date(70), 100)).toEqual([
        res4,
      ]);

      expect(await repo.find("topic", "before", true, new Date(30), 100)).toEqual([
        res3,
        res5,
        res6,
      ]);

      expect(await repo.find("topic", "before", true, new Date(30), 2)).toEqual([
        res3,
        res5,
      ]);

      expect(await repo.find("topic", "before", false, new Date(30), 100)).toEqual([
        res5,
        res6,
      ]);

      expect(await repo.find("topic", "after", false, new Date(90), 100)).toEqual([]);
      expect(await repo.find("topic", "before", false, new Date(30), 0)).toEqual([]);
    });
  });

  describe("findNew", () => {
    it("正常に検索出来るか", async () => {
      const repo = repoGene();

      expect(await repo.findNew("topic", 100)).toEqual([]);

      const res = new ResNormal("name",
        "body",
        null,
        "active",
        null,
        true,
        "res",
        "topic",
        new Date(0),
        "user",
        Im.List(),
        5,
        "hash",
        0,
      );

      const res1 = res.copy({ id: "res1", date: new Date(50) });
      const res2 = res.copy({ id: "res2", date: new Date(80), topic: "topic2" });
      const res3 = res.copy({ id: "res3", date: new Date(30) });
      const res4 = res.copy({ id: "res4", date: new Date(90) });

      await repo.insert(res1);
      await repo.insert(res2);
      await repo.insert(res3);
      await repo.insert(res4);

      expect(await repo.findNew("topic", 100)).toEqual([
        res4,
        res1,
        res3,
      ]);

      expect(await repo.findNew("topic", 2)).toEqual([
        res4,
        res1,
      ]);

      expect(await repo.findNew("topic", 0)).toEqual([]);
    });
  });

  describe("findNotice", () => {
    it("正常に検索出来るか", async () => {
      const repo = repoGene();

      const user1 = "user1";
      const user2 = "user2";

      const token: IAuthTokenMaster = {
        id: "token",
        key: "key",
        user: user1,
        type: "master",
      };

      const res = new ResNormal("name",
        "body",
        null,
        "active",
        null,
        true,
        "res",
        "topic",
        new Date(0),
        user1,
        Im.List(),
        5,
        "hash",
        0,
      );

      const res1 = res.copy({ id: "res1", date: new Date(50), reply: null, user: user2 });
      const res2 = res.copy({ id: "res2", date: new Date(80), reply: { res: "res1", user: user2 } });
      const res3 = res.copy({ id: "res3", date: new Date(30), reply: { res: "res2", user: user1 } });
      const res4 = res.copy({ id: "res4", date: new Date(90), reply: { res: "res2", user: user1 } });
      const res5 = res.copy({ id: "res5", date: new Date(20), reply: { res: "res2", user: user1 } });
      const res6 = res.copy({ id: "res6", date: new Date(10), reply: { res: "res2", user: user1 } });
      const res7 = res.copy({ id: "res7", date: new Date(60), reply: { res: "res2", user: user1 } });
      const res8 = res.copy({ id: "res8", date: new Date(40), reply: { res: "res2", user: user1 } });
      const res9 = res.copy({ id: "res9", date: new Date(70), reply: { res: "res2", user: user1 } });

      await repo.insert(res1);
      await repo.insert(res2);
      await repo.insert(res3);
      await repo.insert(res4);
      await repo.insert(res5);
      await repo.insert(res6);
      await repo.insert(res7);
      await repo.insert(res8);
      await repo.insert(res9);

      expect(await repo.findNotice(token, "after", true, new Date(0), 100)).toEqual([
        res4,
        res9,
        res7,
        res8,
        res3,
        res5,
        res6,
      ]);

      expect(await repo.findNotice(token, "after", true, new Date(70), 100)).toEqual([
        res4,
        res9,
      ]);

      expect(await repo.findNotice(token, "after", true, new Date(70), 1)).toEqual([
        res9,
      ]);

      expect(await repo.findNotice(token, "after", false, new Date(70), 100)).toEqual([
        res4,
      ]);

      expect(await repo.findNotice(token, "before", true, new Date(30), 100)).toEqual([
        res3,
        res5,
        res6,
      ]);

      expect(await repo.findNotice(token, "before", true, new Date(30), 2)).toEqual([
        res3,
        res5,
      ]);

      expect(await repo.findNotice(token, "before", false, new Date(30), 100)).toEqual([
        res5,
        res6,
      ]);

      expect(await repo.findNotice(token, "after", false, new Date(90), 100)).toEqual([]);
      expect(await repo.findNotice(token, "before", false, new Date(30), 0)).toEqual([]);
    });
  });

  describe("findNoticeNew", () => {
    it("正常に検索出来るか", async () => {
      const repo = repoGene();

      const user1 = "user1";
      const user2 = "user2";

      const token: IAuthTokenMaster = {
        id: "token",
        key: "key",
        user: user1,
        type: "master",
      };

      expect(await repo.findNoticeNew(token, 100)).toEqual([]);

      const res = new ResNormal("name",
        "body",
        null,
        "active",
        null,
        true,
        "res",
        "topic",
        new Date(0),
        user1,
        Im.List(),
        5,
        "hash",
        0,
      );

      const res1 = res.copy({ id: "res1", date: new Date(50), reply: null, user: user2 });
      const res2 = res.copy({ id: "res2", date: new Date(80), reply: { res: "res1", user: user2 } });
      const res3 = res.copy({ id: "res3", date: new Date(30), reply: { user: "user1", res: "res1" }, user: user2 });
      const res4 = res.copy({ id: "res4", date: new Date(90), reply: { user: "user1", res: "res1" }, user: user2 });

      await repo.insert(res1);
      await repo.insert(res2);
      await repo.insert(res3);
      await repo.insert(res4);

      expect(await repo.findNoticeNew(token, 100)).toEqual([
        res4,
        res3,
      ]);

      expect(await repo.findNoticeNew(token, 1)).toEqual([
        res4,
      ]);

      expect(await repo.findNoticeNew(token, 0)).toEqual([]);
    });
  });

  describe("findHash", () => {
    it("正常に検索出来るか", async () => {
      const repo = repoGene();

      const res = new ResNormal("name",
        "body",
        null,
        "active",
        null,
        true,
        "res",
        "topic",
        new Date(0),
        "user",
        Im.List(),
        5,
        "hash",
        0,
      );

      const res1 = res.copy({ id: "res1", date: new Date(50), hash: "hash2" });
      const res2 = res.copy({ id: "res2", date: new Date(80), hash: "hash1" });
      const res3 = res.copy({ id: "res3", date: new Date(30) });
      const res4 = res.copy({ id: "res4", date: new Date(90) });
      const res5 = res.copy({ id: "res5", date: new Date(20) });
      const res6 = res.copy({ id: "res6", date: new Date(10) });
      const res7 = res.copy({ id: "res7", date: new Date(60) });
      const res8 = res.copy({ id: "res8", date: new Date(40) });
      const res9 = res.copy({ id: "res9", date: new Date(70) });

      await repo.insert(res1);
      await repo.insert(res2);
      await repo.insert(res3);
      await repo.insert(res4);
      await repo.insert(res5);
      await repo.insert(res6);
      await repo.insert(res7);
      await repo.insert(res8);
      await repo.insert(res9);

      expect(await repo.findHash("aaa")).toEqual([]);
      expect(await repo.findHash("hash1")).toEqual([res2]);
      expect(await repo.findHash("hash")).toEqual([
        res4,
        res9,
        res7,
        res8,
        res3,
        res5,
        res6,
      ]);
    });
  });
}

describe("ResRepoMock", () => {
  run(() => new ResRepoMock(), false);
});

describe("ResRepo", () => {
  run(() => new ResRepo(true), true);
});
