import { ObjectID } from "mongodb";

import {
  ObjectIDGenerator,
  Profile,
} from "../../";

describe("Profile", () => {
  {
    const profile = Profile.fromDB({
      _id: new ObjectID(),
      user: new ObjectID(),
      name: "名前",
      body: "本文",
      date: new Date(),
      update: new Date(),
      sn: "sn",
    });
    describe("#toDB", () => {
      it("正常に変換できるか", () => {
        const db = profile.toDB();

        expect(db._id).toEqual(new ObjectID(profile.id));
        expect(db.user).toEqual(new ObjectID(profile.user));
        expect(db.name).toBe(profile.name);
        expect(db.body).toBe(profile.body);
        expect(db.date).toEqual(profile.date);
        expect(db.update).toEqual(profile.update);
        expect(db.sn).toEqual(profile.sn);
      });
    });

    describe("#toAPI", () => {
      for (const data of [
        {
          msg: "認証あり(同一ユーザー)",
          user: new ObjectID(profile.user.toString()),
          apiUser: profile.user.toString(),
        },
        {
          msg: "認証あり(別ユーザー)",
          user: new ObjectID(),
          apiUser: null,
        },
        {
          msg: "認証なし",
          user: null,
          apiUser: null,
        },
      ]) {
        it(data.msg, () => {
          const api = profile.toAPI(data.user !== null ? {
            type: "master",
            user: data.user.toHexString(),
            key: "",
            id: ObjectIDGenerator(),
          } : null);

          expect(api.id).toBe(profile.id.toString());
          expect(api.user).toBe(data.apiUser);
          expect(api.name).toBe(profile.name);
          expect(api.body).toBe(profile.body);
          expect(api.date).toBe(profile.date.toISOString());
          expect(api.update).toBe(profile.update.toISOString());
          expect(api.sn).toBe(profile.sn);
        });
      }
    });
  }

  describe("create", () => {
    it("正常に作れるか", () => {
      const user = new ObjectID().toString();
      const id = new ObjectID().toString();
      const date = new Date();
      const profile = Profile.create(() => id, {
        type: "master",
        user,
        key: "",
        id: ObjectIDGenerator(),
      }, "名前", "本文", "test", date);

      expect(profile.id).toBe(id);
      expect(profile.user).toBe(user);
      expect(profile.name).toBe("名前");
      expect(profile.body).toBe("本文");
      expect(profile.date).toEqual(date);
      expect(profile.update).toEqual(date);
      expect(profile.sn).toBe("test");
    });
  });
});
