import { AppServer } from "../server";

import { addClientAPI } from "./client";
import { addHistoryAPI } from "./history";
import { addMsgAPI } from "./msg";
import { addProfileAPI } from "./profile";
import { addResAPI } from "./res";
import { addTokenAPI } from "./token";
import { addTopicAPI } from "./topic";
import { addUserAPI } from "./user";

export function addAPI(api: AppServer) {
  addClientAPI(api);
  addHistoryAPI(api);
  addMsgAPI(api);
  addProfileAPI(api);
  addResAPI(api);
  addTokenAPI(api);
  addTopicAPI(api);
  addUserAPI(api);
}