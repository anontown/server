import * as express from 'express';
import * as bodyParser from 'body-parser';
import { IAuthToken, IAuthUser } from './auth';
import { Validator } from 'jsonschema';
import { AtError, StatusCode } from './at-error';
import { TokenRepository,UserRepository } from './models';
import { ObjectID } from 'mongodb';
import * as http from 'http';
import * as socketio from 'socket.io';
import { Res } from './models/res';
import { Logger } from './logger';
import * as request from 'request';
import { Config } from './config';

export interface IAPICallParams<T> {
  params: T,
  authToken: IAuthToken | null,
  authUser: IAuthUser | null,
  ip: string,
  now: Date
}

export class API {
  private static valid = new Validator();
  private app: express.Express;
  private server: http.Server;
  private io: SocketIO.Server;

  constructor(private port: number) {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketio.listen(this.server);
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(bodyParser.json());
    this.app.use(Logger.express);
  }

  addAPI<T>({url, isAuthUser, isAuthToken, isRecaptcha = false, schema, call}: {
    url: string,
    schema: Object,
    isAuthToken: boolean,
    isAuthUser: boolean,
    isRecaptcha?: boolean
    call: (params: IAPICallParams<T>) => Promise<any>
  }) {
    this.app.post(url, async (req: express.Request, res: express.Response) => {
      let errorFunc = function (error: AtError) {
        resultFunc(error.statusCode, { message: error.message });
      };

      let resultFunc = function (status: number, data: any) {
        res.charset = "UTF-8";
        res.contentType("application/json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.status(status);
        res.json(data);
      };

      await (async () => {
        //パラメーターチェック
        let paramsCheck = API.valid.validate(req.body, {
          type: "object",
          additionalProperties: false,
          required: ["authUser", "authToken", "params"],
          properties: {
            authUser: {
              type: isAuthUser ? "object" : ["object", "null"],
              additionalProperties: false,
              required: ["id", "pass"],
              properties: {
                id: {
                  type: "string",
                },
                pass: {
                  type: "string",
                }
              }
            },
            recaptcha: {
              type: isRecaptcha ? "string" : ["string", "null"]
            },
            authToken: {
              type: isAuthToken ? "object" : ["object", "null"],
              additionalProperties: false,
              required: ["id", "key"],
              properties: {
                id: {
                  type: "string",
                },
                key: {
                  type: "string",
                }
              }
            },
            params: schema
          }
        });
        if (paramsCheck.errors.length === 0) {
          let authUser: { id: string, pass: string } = req.body.authUser;
          let authToken: { id: string, key: string } = req.body.authToken;
          let recaptcha: string|null = req.body.recaptcha;
          let params: any = req.body.params;

          //認証
          let [authTokenObj, authUserObj] = await Promise.all([
            (authToken !== null ?
              TokenRepository.findOne(new ObjectID(authToken.id)).then(token => token.auth(authToken.key)) :
              Promise.resolve(null)) as Promise<IAuthToken | null>,
            (authUser !== null ?
              UserRepository.findOne(new ObjectID(authUser.id)).then(user => user.auth(authUser.pass)) :
              Promise.resolve(null)) as Promise<IAuthUser | null>,
            (isRecaptcha !== null ?
              new Promise<void>((resolve, reject) => {
                request.post("https://www.google.com/recaptcha/api/siteverify", {
                  form: {
                    secret: Config.recaptcha.secretKey,
                    response: recaptcha
                  }
                },
                  (err, _res, body) => {
                    if (err) {
                      reject("キャプチャAPIでエラー");
                    }
                    if (JSON.parse(body).success) {
                      resolve();
                    } else {
                      reject(new AtError(StatusCode.Forbidden, "キャプチャ認証に失敗"));
                    }
                  });
              }) :
              Promise.resolve(null)) as Promise<void>,
          ]);

          let result = await call({
            params,
            authToken: authTokenObj,
            authUser: authUserObj,
            ip: req.headers["X-Real-IP"] || req.connection.remoteAddress,
            now: new Date()
          });
          resultFunc(200, result);
          console.log("成功");
        } else {
          throw new AtError(StatusCode.MisdirectedRequest, "パラメーターが不正です");
        }
      })().catch(e => {
        if (e instanceof AtError) {
          errorFunc(e);
        } else {
          Logger.error.error("サーバー内部エラー", e);
          errorFunc(new AtError(StatusCode.InternalServerError, "サーバー内部エラー"));
        }
      });
    });

    //optionsメソッド
    this.app.options(url, (_req, res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type")
      res.setHeader("Access-Control-Allow-Methods", "POST");
      res.setHeader("Access-Control-Max-Age", (60 * 60 * 24 * 365).toString());
      res.end();
    });
  }

  run() {
    /*socket設定*/
    let con = this.io.on("connection", (socket) => {
      socket.on("topic-join", (msg: string) => {
        socket.join("topic-" + msg);
      });

      socket.on("topic-leave", (msg: string) => {
        socket.leave("topic-" + msg);
      });

      socket.on('disconnect', function () {
        //切断
      });
    });
    Res.writeListener.add((res) => {
      //トピック更新通知
      con.to("topic-" + res.topic.toString()).emit("topic", res.topic.toString());
    });

    this.server.listen(this.port);
    Logger.system.info("サーバー起動");
  }
}



