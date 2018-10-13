export type AppErrorJSON = AppRootErrorJSON | AppServerErrorJSON | AppNotFountErrorJSON;

export function fromJSON(json: AppErrorJSON): AppRootError {

}

export interface AppRootErrorJSON {
  code: "root";
  data: {};
}

export class AppRootError {
  toJSON(): AppErrorJSON {
    return {
      code: "root",
      data: {},
    };
  }
}

export interface AppServerErrorJSON {
  code: "server";
  data: {};
}

export class AppServerError extends AppRootError {
  toJSON(): AppErrorJSON {
    return {
      code: "server",
      data: {},
    };
  }
}

export interface AppNotFountErrorJSON {
  code: "not_found",
  data: {},
}

export class AppNotFoundError extends AppRootError {
  toJSON(): AppErrorJSON {
    return {
      code: "not_found",
      data: {},
    };
  }
}