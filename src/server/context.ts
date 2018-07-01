import { IRepo } from "../models";
import { AuthContainer } from "./auth-container";

export interface Context {
  auth: AuthContainer;
  ip: string;
  now: Date;
  log: (name: string, id: string) => void;
  repo: IRepo;
}