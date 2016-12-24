import * as express from 'express';
import * as bodyParser from 'body-parser';
import { IAuthToken, IAuthUser } from './auth';
import { Validator } from 'jsonschema';
import { AtError, StatusCode } from './at-error';
import { User, Token } from './models';
import { ObjectID } from 'mongodb';


export class API {
  private static valid = new Validator();
  private app: express.Express;

  constructor(private port: number) {
    this.app = express();
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(bodyParser.json());
  }

  addAPI({url, isAuthUser, isAuthToken, schema, call}: {
    url: string,
    schema: Object,
    isAuthToken: boolean,
    isAuthUser: boolean,
    call: (params: any, authToken: IAuthToken | null, authUser: IAuthUser | null) => Promise<any>
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
          let params: any = req.body.params;

          //認証
          let auth = await Promise.all([
            (authToken !== null ?
              Token.findOne(new ObjectID(authToken.id)).then(token => token.auth(authToken.key)) :
              Promise.resolve(null)) as Promise<IAuthToken | null>,
            (authUser !== null ?
              User.findOne(new ObjectID(authUser.id)).then(user => user.auth(authUser.pass)) :
              Promise.resolve(null)) as Promise<IAuthUser | null>
          ]);

          let result = await call(params, auth[0], auth[1]);
          resultFunc(200, result);
          console.log("成功");
        } else {
          throw new AtError(StatusCode.MisdirectedRequest, "パラメーターが不正です");
        }
      })().catch(e => {
        if (e instanceof AtError) {
          errorFunc(e);
        } else {
          errorFunc(new AtError(StatusCode.InternalServerError, "サーバー内部エラー"));
        }
        console.log("例外", e);
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
    this.app.listen(this.port);
    console.log("サーバー起動");
  }
}



