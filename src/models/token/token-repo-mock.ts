import { AtNotFoundError } from "../../at-error";
import { IAuthTokenMaster, IAuthUser } from "../../auth";
import { ITokenRepo } from "./itoken-repo";
import { ITokenDB, Token, TokenGeneral, TokenMaster } from "./token";

export class TokenRepoMock implements ITokenRepo {
  private tokens: ITokenDB[] = [];

  async findOne(id: string): Promise<Token> {
    const token = this.tokens.find(x => x._id.toHexString() === id);
    if (token === undefined) {
      throw new AtNotFoundError("トークンが存在しません");
    }

    switch (token.type) {
      case "general":
        return TokenGeneral.fromDB(token);
      case "master":
        return TokenMaster.fromDB(token);
    }
  }

  async findAll(authToken: IAuthTokenMaster): Promise<Token[]> {
    const tokens = this.tokens
      .filter(x => x.user.toHexString() === authToken.user)
      .sort((a, b) => b.date.valueOf() - a.date.valueOf());

    return tokens.map(t => {
      switch (t.type) {
        case "general":
          return TokenGeneral.fromDB(t);
        case "master":
          return TokenMaster.fromDB(t);
      }
    });
  }

  async insert(token: Token): Promise<void> {
    this.tokens.push(token.toDB());
  }

  async update(token: Token): Promise<void> {
    this.tokens[this.tokens.findIndex(x => x._id.toHexString() === token.id)] = token.toDB();
  }

  async delClientToken(token: IAuthTokenMaster, clientID: string): Promise<void> {
    this.tokens = this.tokens.filter(x => !(x.user.toHexString() === token.user
      && x.type === "general"
      && x.client.toHexString() === clientID));
  }

  async delMasterToken(user: IAuthUser): Promise<void> {
    this.tokens = this.tokens.filter(x => !(x.user.toHexString() === user.id
      && x.type === "master"));
  }
}
