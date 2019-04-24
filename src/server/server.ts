import { combineResolvers } from "apollo-resolvers";
import { ApolloServer, gql, IResolvers } from "apollo-server-express";
import * as cors from "cors";
import * as express from "express";
import * as fs from "fs";
import {
  GraphQLDateTime,
} from "graphql-iso-date";
import { AtErrorSymbol, AtServerError } from "../at-error";
import { Config } from "../config";
import { IRepo } from "../models";
import { resolvers as appResolvers } from "../resolvers";
import { AppContext, createContext } from "./context";

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
      path: "/",
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
  app.get("/ping", cors(), (_req, res) => res.send("OK"));
  server.applyMiddleware({ app, path: "/" });

  app.listen({ port: Config.server.port }, () => {
    console.log(`Server ready at ${server.graphqlPath}, ${server.subscriptionsPath}`);
  });
}
