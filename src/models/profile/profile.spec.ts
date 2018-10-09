import { ObjectID } from "mongodb";

import {
  IAuthTokenMaster,
  ObjectIDGenerator,
  Profile,
} from "../../";

describe("Profile", () => {
  const profileID = ObjectIDGenerator();
  const userID = ObjectIDGenerator();
  const profile = new Profile(profileID,
    userID,
    "name",
    "text",
    new Date(0),
    new Date(100),
    "sn");

  const auth: IAuthTokenMaster = {
    type: "master",
    user: userID,
    key: "key",
    id: ObjectIDGenerator(),
  };

  describe("#toDB", () => {
    it("正常に変換できるか", () => {
      expect(profile.toDB()).toEqual({
        _id: new ObjectID(profileID),
        user: new ObjectID(userID),
        name: "name",
        text: "text",
        date: new Date(0),
        update: new Date(100),
        sn: "sn",
      });
    });
  });

  describe("#toAPI", () => {
    it("認証あり(同一ユーザー)", () => {
      expect(profile.toAPI(auth)).toEqual({
        id: profileID,
        self: true,
        name: "name",
        text: "text",
        date: new Date(0).toISOString(),
        update: new Date(100).toISOString(),
        sn: "sn",
      });
    });

    it("認証あり(別ユーザー)", () => {
      expect(profile.toAPI({
        ...auth,
        user: ObjectIDGenerator(),
      })).toEqual({
        id: profileID,
        self: false,
        name: "name",
        text: "text",
        date: new Date(0).toISOString(),
        update: new Date(100).toISOString(),
        sn: "sn",
      });
    });

    it("認証なし", () => {
      expect(profile.toAPI(null)).toEqual({
        id: profileID,
        self: null,
        name: "name",
        text: "text",
        date: new Date(0).toISOString(),
        update: new Date(100).toISOString(),
        sn: "sn",
      });
    });
  });
  // TODO: createの異常系とchangeDataのテスト
  describe("create", () => {
    it("正常に作れるか", () => {
      expect(Profile.create(() => profileID,
        auth,
        "name",
        "text",
        "scn",
        new Date(0))).toEqual(profile.copy({ update: new Date(0), sn: "scn" }));
    });
  });
});
