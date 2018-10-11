import { none, Option, some } from "fp-ts/lib/Option";
import { AtAuthError } from "../at-error";
import { IAuthToken, IAuthTokenMaster } from "../auth";

export class AuthContainer {
  constructor(private _token: Option<IAuthToken>) {
  }

  get token(): IAuthToken {
    if (this._token.isNone()) {
      throw new AtAuthError("認証が必要です");
    }

    return this._token.value;
  }

  get tokenMaster(): IAuthTokenMaster {
    const t = this.token;
    if (t.type === "general") {
      throw new AtAuthError("マスタートークンでの認証が必要です");
    }
    return t;
  }

  get tokenOrNull(): Option<IAuthToken> {
    return this._token;
  }

  get TokenMasterOrNull(): Option<IAuthTokenMaster> {
    return this._token.chain(token => token.type === "master" ? some(token) : none);
  }
}
