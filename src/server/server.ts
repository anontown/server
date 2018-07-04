import { graphiqlExpress, graphqlExpress } from "apollo-server-express";
import bodyParser from "body-parser";
import express from "express";
import * as fs from "fs";
import { execute, subscribe } from "graphql";
import { makeExecutableSchema } from "graphql-tools";
import * as http from "http";
import { SubscriptionServer } from "subscriptions-transport-ws";
import { Config } from "../config";
import { Context } from "./context";

const schema = makeExecutableSchema<Context>({
  typeDefs: fs.readFileSync("app.gql", "utf8"),
  resolvers: {
    Query: {

    },
    Mutation: {

    },
    Subscription: {

    },
  },
});

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const server = http.createServer(app as any);

app.use("/graphql", graphqlExpress(async (_req, _res) => {
  return {
    schema,
    context: {},
  };
}));
app.get("/graphiql", graphiqlExpress({ endpointURL: "/graphql" }));

server.listen(Config.server.port, () => {
  SubscriptionServer.create({
    schema,
    execute,
    subscribe,
    onConnect: async () => {
      /* tslint:disable:no-empty */
    },
  }, {
      server, path: "subscriptions",
    });
});
