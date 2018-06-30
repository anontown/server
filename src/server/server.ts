import express from 'express';
import bodyParser from 'body-parser';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { execute, subscribe } from "graphql";
import * as fs from "fs";
import { Config } from "../config";
import * as http from "http";
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { makeExecutableSchema } from "graphql-tools";
import { PubSub } from "graphql-subscriptions";

type Context = {};

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


export const pubsub = new PubSub();

app.use("/graphql", graphqlExpress(async _req => {
  return {
    schema,
    context: {}
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
  }, { server, path: "subscriptions" })
});
