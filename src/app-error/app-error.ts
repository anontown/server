export class AppError {
  getCode() {
    return "app";
  }

  getData() {
    return {};
  }

  toJSON() {
    return {
      code: this.getCode(),
      data: this.getData(),
    };
  }
}

export class AppServerError extends AppError {
  getCode() {
    return "server";
  }
}

export class AppNotFoundError extends AppError {
  getCode() {
    return "not_found";
  }
}