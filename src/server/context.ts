import { none, some } from "fp-ts/lib/Option";
import { AtAuthError } from "../at-error";
import { Logger } from "../logger";
import { createLoader, IRepo, Loader } from "../models";
import { AuthContainer } from "./auth-container";
import * as authFromApiParam from "./auth-from-api-param";

export interface AppContext {
  auth: AuthContainer;
  ip: string;
  now: Date;
  log: (name: string, id: string) => void;
  loader: Loader;
}

async function createToken(raw: any, repo: IRepo) {
  if (typeof raw !== "string") {
    return none;
  }
  const arr = raw.split(",");
  if (arr.length !== 2) {
    throw new AtAuthError("パラメーターが不正です");
  }

  const [id, key] = arr;
  return some(await authFromApiParam.token(repo.token, { id, key }));
}

export async function createContext(headers: any, repo: IRepo): Promise<AppContext> {
  const ip = headers["x-real-ip"] || "<unknown_ip>";

  const token = await createToken(headers["x-token"], repo);

  const auth = new AuthContainer(token);

  return {
    auth,
    ip,
    now: new Date(),
    log: (name, id) => Logger.app.info(ip, name, id),
    loader: createLoader(repo, auth),
  };
}
