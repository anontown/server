import { combineResolvers } from "apollo-resolvers";
import { ApolloServer, gql, IResolvers } from "apollo-server";
import * as fs from "fs";
import {
  GraphQLDateTime,
} from "graphql-iso-date";
import { Config } from "../config";
import * as controllers from "../controllers";
import { IRepo } from "../models";
import { Context, createContext } from "./context";

export async function serverRun(repo: IRepo) {
  const typeDefs = gql(fs.readFileSync("resources/app.gql", "utf8"));
  const resolvers: IResolvers = combineResolvers([
    {
      DateTime: GraphQLDateTime,
    },
    controllers.clientResolver(repo),
    controllers.historyResolver(repo),
    controllers.msgResolver(repo),
    controllers.profileResolver(repo),
    controllers.resResolver(repo),
    controllers.storageResolver(repo),
    controllers.tokenResolver(repo),
    controllers.topicResolver(repo),
    controllers.userResolver(repo),
  ]);
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }: any): Promise<Context> => {
      return createContext(req.headers, repo);
    },
    subscriptions: {
      onConnect: (connectionParams, _webSocket): Promise<Context> => {
        return createContext(connectionParams, repo);
      },
    },
    introspection: true,
    playground: {
      tabs: [
        {
          endpoint: "/",
          query: "",
          headers: {
            "X-User": "",
            "X-Token": "",
            "X-Recaptcha": "",
          },
        },
      ],
    },
    debug: false,
    formatError: (error: any) => {
      console.log(error);
      return new Error("Internal server error");
    },
  });

  await server.listen(Config.server.port).then(({ url, subscriptionsUrl }) => {
    console.log(`Server ready at ${url} ${subscriptionsUrl}`);
  });
}
