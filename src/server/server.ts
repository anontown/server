import { ApolloServer, gql, withFilter, IResolvers } from "apollo-server";
import * as fs from "fs";
import { Config } from "../config";
import { createContext, Context } from "./context";
import {
  GraphQLDateTime
} from 'graphql-iso-date';

const typeDefs = gql(fs.readFileSync("app.gql", "utf8"));
const resolvers: IResolvers = {
  Query: {

  },
  Mutation: {

  },
  Subscription: {

  },
  DateTime: GraphQLDateTime
};
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: (req: any): Promise<Context> => {
    return createContext(req.headers);
  },
  subscriptions: {
    onConnect: (connectionParams, _webSocket): Promise<Context> => {
      return createContext(connectionParams);
    },
  },
  introspection: true,
  playground: true,
});

server.listen(Config.server.port).then(({ url, subscriptionsUrl }) => {
  console.log(`Server ready at ${url} ${subscriptionsUrl}`);
});
