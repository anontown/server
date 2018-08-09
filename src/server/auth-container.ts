import { AtAuthError } from "../at-error";
import { IAuthToken, IAuthTokenMaster } from "../auth";

export class AuthContainer {
  constructor(private _token: IAuthToken | null) {
  }

  get token(): IAuthToken {
    if (this._token === null) {
      throw new AtAuthError("認証が必要です");
    }

    return this._token;
  }

  get tokenMaster(): IAuthTokenMaster {
    const t = this.token;
    if (t.type === "general") {
      throw new AtAuthError("マスタートークンでの認証が必要です");
    }
    return t;
  }

  get tokenOrNull(): IAuthToken | null {
    return this._token;
  }

  get TokenMasterOrNull(): IAuthTokenMaster | null {
    if (this._token !== null && this._token.type === "general") {
      return null;
    }

    return this._token;
  }
}
