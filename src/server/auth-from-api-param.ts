import {
  IAuthToken,
  IAuthUser,
} from "../auth";

import * as request from "request";

import {
  ITokenRepo,
  IUserRepo,
} from "../models";

import {
  AtCaptchaError, AtAuthError,
} from "../at-error";

import { Config } from "../config";
import * as G from "../generated/graphql";
import { isNull } from "util";
import { isNullish } from "@kgtkr/utils";

export async function token(
  tokenRepo: ITokenRepo,
  apiParamToken: { id: string, key: string }): Promise<IAuthToken> {

  const token = await tokenRepo.findOne(apiParamToken.id);
  const authToken = token.auth(apiParamToken.key);

  return authToken;
}

export async function user(
  userRepo: IUserRepo,
  apiParamUser: G.AuthUser): Promise<IAuthUser> {
  let id;
  if (!isNullish(apiParamUser.id) && isNullish(apiParamUser.sn)) {
    id = apiParamUser.id;
  } else if (isNullish(apiParamUser.id) && !isNullish(apiParamUser.sn)) {
    id = await userRepo.findID(apiParamUser.sn);
  } else {
    throw new AtAuthError("AuthUserはidかsnのどちらか片方を指定して下さい");
  }
  const user = await userRepo.findOne(id);
  const authUser = user.auth(apiParamUser.pass);

  return authUser;
}

export async function recaptcha(apiParamRecaptcha: string) {
  const result = await new Promise<string>((resolve, reject) => {
    request.post("https://www.google.com/recaptcha/api/siteverify", {
      form: {
        secret: Config.recaptcha.secretKey,
        response: apiParamRecaptcha,
      },
    },
      (err, _res, body: string) => {
        if (err) {
          reject("キャプチャAPIでエラー");
        } else {
          resolve(body);
        }
      });
  });

  if (!JSON.parse(result).success) {
    throw new AtCaptchaError();
  }
}
