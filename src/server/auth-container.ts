import { IAuthToken, IAuthTokenMaster, IAuthUser } from "../auth";
import { AtAuthError } from "../at-error";

export class AuthContainer {
  constructor(private _token: IAuthToken | null,
    private _user: IAuthUser | null,
    private _recaptcha: boolean) {
  }

  recaptcha() {
    if (!this.recaptcha) {
      throw new AtAuthError("キャプチャ認証が必要です");
    }
  }

  get token(): IAuthToken {
    if (this._token === null) {
      throw new Error();
    }

    return this._token;
  }

  get tokenMaster(): IAuthTokenMaster {
    const t = this.token;
    if (t.type === "general") {
      throw new Error();
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

  get user(): IAuthUser {
    if (this._user === null) {
      throw new Error();
    }

    return this._user;
  }
}
