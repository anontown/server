
import { IResAPI } from "./res";
import { ITokenGeneralAPI, ITokenReqAPI } from "./token";

export interface IResAddedAPI {
  res: IResAPI;
  count: number;
}

export interface CreateTokenGeneralResponseAPI {
  token: ITokenGeneralAPI;
  req: ITokenReqAPI;
}
