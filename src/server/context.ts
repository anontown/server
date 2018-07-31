import { AtAuthError } from "../at-error";
import { Logger } from "../logger";
import { IRepo, Repo } from "../models";
import { AuthContainer } from "./auth-container";
import * as authFromApiParam from "./auth-from-api-param";

export interface Context {
  auth: AuthContainer;
  ip: string;
  now: Date;
  log: (name: string, id: string) => void;
  repo: IRepo;
}

async function createUser(raw: any, repo: IRepo) {
  if (typeof raw !== "string") {
    return null;
  }
  const arr = raw.split(",");
  if (arr.length !== 2) {
    throw new AtAuthError("パラメーターが不正です");
  }

  const [id, pass] = arr;
  return authFromApiParam.user(repo.user, { id, pass }, true);
}

async function createToken(raw: any, repo: IRepo) {
  if (typeof raw !== "string") {
    return null;
  }
  const arr = raw.split(",");
  if (arr.length !== 2) {
    throw new AtAuthError("パラメーターが不正です");
  }

  const [id, key] = arr;
  return authFromApiParam.token(repo.token, { id, key }, "no");
}

async function createRecaptcha(raw: any) {
  if (typeof raw !== "string") {
    return false;
  }
  await authFromApiParam.recaptcha(raw, true);
  return true;
}

export async function createContext(headers: any): Promise<Context> {
  const ip = headers["X-Real-IP"] || "unknown_ip";
  const repo = new Repo();

  const user = await createUser(headers["X-User"], repo);
  const token = await createToken(headers["X-Token"], repo);
  const recaptcha = await createRecaptcha(headers["X-Recaptcha"]);

  return {
    auth: new AuthContainer(token, user, recaptcha),
    ip,
    now: new Date(),
    repo,
    log: (name, id) => Logger.app.info(ip, name, id),
  };
}
