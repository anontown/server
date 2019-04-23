import { combineResolvers } from "apollo-resolvers";
import { ApolloServer, gql, IResolvers } from "apollo-server-express";
import * as fs from "fs";
import {
  GraphQLDateTime,
} from "graphql-iso-date";
import { AtErrorSymbol, AtServerError } from "../at-error";
import { Config } from "../config";
import { IRepo } from "../models";
import { resolvers as appResolvers } from "../resolvers";
import { AppContext, createContext } from "./context";
import * as express from "express";

export async function serverRun(repo: IRepo) {
  const typeDefs = gql(fs.readFileSync("node_modules/@anontown/schema/app.gql", "utf8"));
  const resolvers: IResolvers = combineResolvers([
    {
      DateTime: GraphQLDateTime,
    },
    appResolvers,
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

  repo.cron();

  const app = express();
  server.applyMiddleware({ app });

  app.listen({ port: Config.server.port }, () => {
    console.log(`Server ready at ${server.graphqlPath}, ${server.subscriptionsPath}`);
  });
}
