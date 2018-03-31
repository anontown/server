import { IClientRepo } from "./client";
import { IHistoryRepo } from "./history";
import { IMsgRepo } from "./msg";
import { IProfileRepo } from "./profile";
import { IResRepo } from "./res";
import { ITokenRepo } from "./token";
import { ITopicRepo } from "./topic";
import { IUserRepo } from "./user";
import { IStorageRepo } from "./storage";

export interface IRepo {
  readonly client: IClientRepo;
  readonly history: IHistoryRepo;
  readonly msg: IMsgRepo;
  readonly profile: IProfileRepo;
  readonly res: IResRepo;
  readonly token: ITokenRepo;
  readonly topic: ITopicRepo;
  readonly user: IUserRepo;
  readonly storage: IStorageRepo;
}
