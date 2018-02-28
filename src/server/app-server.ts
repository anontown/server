import * as bodyParser from "body-parser";
import * as express from "express";
import * as http from "http";
import { Observable, Subscription } from "rxjs";
import * as url from "url";
import * as ws from "ws";
import {
  AtError,
  AtServerError,
} from "../at-error";
import { Logger } from "../logger";
import { IRepo } from "../models";
import { AuthContainer } from "./auth-container";
import * as authFromApiParam from "./auth-from-api-param";
import { jsonSchemaCheck } from "./json-schema-check";
import * as schemas from "./schemas";

export interface IHttpAPICallParams<TParams> {
  params: TParams;
  auth: AuthContainer;
  ip: string;
  now: Date;
}

interface IHttpAPIParams<TParams, TResult> {
  url: string;
  schema: object;
  isAuthToken: "master" | "all" | "no";
  isAuthUser: boolean;
  isRecaptcha?: boolean;
  call: (params: IHttpAPICallParams<TParams>) => Promise<TResult>;
}

export interface ISocketAPICallParams<TParams> {
  params: TParams;
  auth: AuthContainer;
  now: Date;
}

interface ISocketAPIParams<TParams, TResult> {
  name: string;
  schema: object;
  isAuthToken: "master" | "all" | "no";
  isAuthUser: boolean;
  isRecaptcha: boolean;
  call: (params: ISocketAPICallParams<TParams>) => Promise<Observable<TResult>>;
}

export class AppServer {
  private app: express.Express;
  private server: http.Server;
  private socketAPIs = new Map<string, ISocketAPIParams<any, any>>();
  private wsServer: ws.Server;

  constructor(private port: number, private repo: IRepo) {
    this.app = express();
    this.server = http.createServer(this.app as any);
    this.wsServer = new ws.Server({ server: this.server });
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(bodyParser.json());
    this.app.use(Logger.express);
  }

  addSocketAPI<TParams, TResult>(param: ISocketAPIParams<TParams, TResult>) {
    this.socketAPIs.set(param.name, param);
  }

  addAPI<TParams, TResult>(
    { url, isAuthUser, isAuthToken, isRecaptcha = false, schema, call }: IHttpAPIParams<TParams, TResult>) {
    // CORS
    this.app.options(url, (_req, res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      res.setHeader("Access-Control-Allow-Methods", "POST");
      res.setHeader("Access-Control-Max-Age", (60 * 60 * 24 * 365).toString());
      res.end();
    });

    // POST
    this.app.post(url, async (req: express.Request, res: express.Response) => {
      try {
        res.charset = "UTF-8";
        res.contentType("application/json");
        res.setHeader("Access-Control-Allow-Origin", "*");

        const { auth, params } = await this.apiJSON<TParams>({
          json: req.body,
          schema,
          isAuthToken,
          isAuthUser,
          isRecaptcha,
        });

        const result = await call({
          params,
          auth,
          ip: req.headers["X-Real-IP"] || req.connection.remoteAddress,
          now: new Date(),
        });

        res.status(200);
        res.json(result);
        Logger.system.info("成功");
      } catch (e) {
        if (e instanceof AtError) {
          res.status(e.statusCode);
          res.json(e.toJSON());
        } else {
          Logger.error.error("サーバー内部エラー", e);

          const serverError = new AtServerError();
          res.status(serverError.statusCode);
          res.json(serverError.toJSON());
        }
      }
    });
  }

  /**
   * サーバーを起動します
   */
  run() {
    // websocket
    this.wsServer.on("connection", async ws => {
      // urlを解析してクエリオブジェクトを取得
      if (ws.upgradeReq.url === undefined) {
        ws.close();
        return;
      }
      const query = url.parse(ws.upgradeReq.url, true).query;
      if (typeof query !== "object") {
        ws.close();
        return;
      }

      // クエリからnameとparamsを取得
      const name = query.name;
      const paramsStr = query.params;
      if (typeof name !== "string" || typeof paramsStr !== "string") {
        ws.close();
        return;
      }

      // nameからapiデータ取得
      const api = this.socketAPIs.get(name);
      if (api === undefined) {
        ws.close();
        return;
      }

      // paramsをオブジェクトにパース
      let json: any;
      try {
        json = JSON.parse(paramsStr);
      } catch (_e) {
        ws.close();
        return;
      }

      const { auth, params } = await this.apiJSON<any>({
        json,
        schema: api.schema,
        isAuthToken: api.isAuthToken,
        isAuthUser: api.isAuthUser,
        isRecaptcha: api.isRecaptcha,
      });

      let subscribe: Subscription | null = null;

      try {
        subscribe = (await api.call({
          params,
          auth,
          now: new Date(),
        })).subscribe(
          onNext => {
            ws.send(JSON.stringify(onNext));
          },
          _onError => {
            if (subscribe !== null) {
              subscribe.unsubscribe();
            }
            ws.close();
          },
          () => {
            if (subscribe !== null) {
              subscribe.unsubscribe();
            }
            ws.close();
          });
      } catch (_e) {
        ws.close();
      }

      ws.on("close", () => {
        if (subscribe !== null) {
          subscribe.unsubscribe();
        }
      });
    });
    this.server.listen(this.port);
    Logger.system.info(`listen port ${this.port}`);
  }

  private async apiJSON<TParams>(
    parameter: {
      json: any, schema: object, isAuthToken: "master" | "all" | "no",
      isAuthUser: boolean,
      isRecaptcha: boolean,
    }): Promise<{ params: TParams, auth: AuthContainer }> {
    // パラメーターチェック
    jsonSchemaCheck(parameter.json, {
      type: "object",
      additionalProperties: false,
      required: ["authUser", "authToken", "params"],
      properties: {
        authUser: schemas.authUser,
        recaptcha: schemas.recaptcha,
        authToken: schemas.authToken,
        params: parameter.schema,
      },
    });

    const authUser: { id: string, pass: string } | null = parameter.json.authUser;
    const authToken: { id: string, key: string } | null = parameter.json.authToken;
    const recaptcha: string | null = parameter.json.recaptcha;
    const params: TParams = parameter.json.params;

    // 認証
    const [authTokenObj, authUserObj] = await Promise.all([
      authFromApiParam.token(this.repo.token, authToken, parameter.isAuthToken),
      authFromApiParam.user(this.repo.user, authUser, parameter.isAuthUser),
      authFromApiParam.recaptcha(recaptcha, parameter.isRecaptcha),
    ]);

    return {
      params,
      auth: new AuthContainer(authTokenObj, authUserObj),
    };
  }
}
