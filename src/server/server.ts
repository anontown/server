import express from 'express';
import bodyParser from 'body-parser';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { execute, subscribe } from "graphql";
import * as fs from "fs";
import { Config } from "../config";
import * as http from "http";
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { makeExecutableSchema } from "graphql-tools";
import { Context } from "./context";

const schema = makeExecutableSchema<Context>({
  typeDefs: fs.readFileSync("app.gql", "utf8"),
  resolvers: {
    Query: {

    },
    Mutation: {

    },
    Subscription: {

    }
  }
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
  new SubscriptionServer({
    schema,
    execute,
    subscribe,
    onConnect: async () => {

    }
  }, {
      server, path: "subscriptions"
    })
});
