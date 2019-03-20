import { Option } from "fp-ts/lib/Option";
import { AtAuthError, AtNotFoundError } from "../../at-error";
import { IAuthTokenMaster } from "../../auth";
import { Client, IClientDB } from "./client";
import { IClientRepo } from "./iclient-repo";
import * as G from "../../generated/graphql";
import { isNullOrUndefined } from "../../utils/index";

export class ClientRepoMock implements IClientRepo {
  private clients: IClientDB[] = [];

  async findOne(id: string): Promise<Client> {
    const client = this.clients.find(c => c._id.toHexString() === id);

    if (client === undefined) {
      throw new AtNotFoundError("クライアントが存在しません");
    }
    return Client.fromDB(client);
  }

  async insert(client: Client): Promise<void> {
    this.clients.push(client.toDB());
  }

  async update(client: Client): Promise<void> {
    this.clients[this.clients.findIndex(c => c._id.toHexString() === client.id)] = client.toDB();
  }

  async find(authToken: Option<IAuthTokenMaster>, query: G.ClientQuery): Promise<Client[]> {
    if (query.self && authToken.isNone()) {
      throw new AtAuthError("認証が必要です");
    }

    const clients = this.clients
      .filter(c => !query.self || authToken.isNone() || c.user.toHexString() === authToken.value.user)
      .filter(x => isNullOrUndefined(query.id) || query.id.includes(x._id.toHexString()))
      .sort((a, b) => b.date.valueOf() - a.date.valueOf());

    return clients.map(c => Client.fromDB(c));
  }
}
