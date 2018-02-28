import { IClientRepo } from "./client";
import { IHistoryRepo } from "./history";
import { IMsgRepo } from "./msg";
import { IProfileRepo } from "./profile";
import { IResRepo } from "./res";
import { ITokenRepo } from "./token";
import { ITopicRepo } from "./topic";
import { IUserRepo } from "./user";

export interface IRepo {
  client: IClientRepo;
  history: IHistoryRepo;
  msg: IMsgRepo;
  profile: IProfileRepo;
  res: IResRepo;
  token: ITokenRepo;
  topic: ITopicRepo;
  user: IUserRepo;
}