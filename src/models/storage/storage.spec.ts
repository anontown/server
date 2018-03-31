import {
  Storage,
  ObjectIDGenerator,
  IAuthTokenGeneral,
  IAuthTokenMaster,
} from "../../";

describe("Storage", () => {
  const cleintID = ObjectIDGenerator();
  const userID = ObjectIDGenerator();

  const storage = new Storage(ObjectIDGenerator(),
    cleintID,
    userID,
    "key",
    "value");

  const authMaster: IAuthTokenMaster = {
    id: ObjectIDGenerator(),
    key: "tokenkey",
    user: userID,
    type: "master",
  };

  const authGeneral: IAuthTokenGeneral = {
    id: ObjectIDGenerator(),
    key: "tokenkey",
    user: userID,
    type: "general",
    client: cleintID
  };
});