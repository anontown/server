import { IAuthToken, IAuthTokenMaster, IAuthUser } from "../auth";

export class AuthContainer {
  constructor(private _token: IAuthToken | null,
              private _user: IAuthUser | null) {
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
