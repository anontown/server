import {
  User,
  ObjectIDGenerator,
  hash,
  Config
} from "../../";
import { ObjectID } from "mongodb";

describe("User", () => {
  const userID = ObjectIDGenerator();
  const user = new User(userID,
    "scn",
    hash("pass" + Config.salt.pass),
    1,
    {
      last: new Date(300),
      m10: 0,
      m30: 0,
      h1: 0,
      h6: 0,
      h12: 0,
      d1: 0,
    },
    new Date(100),
    new Date(0),
    0,
    new Date(150)
  );
});