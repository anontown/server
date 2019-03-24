import { combineResolvers } from "apollo-resolvers";
import { ApolloServer, gql, IResolvers } from "apollo-server";
import * as fs from "fs";
import {
  GraphQLDateTime,
} from "graphql-iso-date";
import { AtErrorSymbol, AtServerError } from "../at-error";
import { Config } from "../config";
import * as controllers from "../resolvers";
import { IRepo } from "../models";
import { AppContext, createContext } from "./context";

export async function serverRun(repo: IRepo) {
  const typeDefs = gql(fs.readFileSync("resources/app.gql", "utf8"));
  const resolvers: IResolvers = combineResolvers([
    {
      DateTime: GraphQLDateTime,
    },
    controllers.clientResolver,
    controllers.historyResolver,
    controllers.msgResolver,
    controllers.profileResolver,
    controllers.resResolver,
    controllers.storageResolver,
    controllers.tokenResolver,
    controllers.topicResolver,
    controllers.userResolver,
  ]);
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }: any): Promise<AppContext> => {
      return createContext(req !== undefined ? req.headers : {}, repo);
    },
    subscriptions: {
      onConnect: (connectionParams, _webSocket): Promise<AppContext> => {
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
            "X-Token": "",
          },
        },
      ],
    },
    debug: false,
    formatError: (error: any) => {
      console.log(error);
      if (error.extensions.exception[AtErrorSymbol]) {
        return error.extensions.exception.data;
      } else {
        return new AtServerError().data;
      }
    },
  });

  await server.listen(Config.server.port).then(({ url, subscriptionsUrl }) => {
    console.log(`Server ready at ${url} ${subscriptionsUrl}`);
  });
}
