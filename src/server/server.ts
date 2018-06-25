import express from 'express';
import bodyParser from 'body-parser';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { buildSchema, execute, subscribe } from "graphql";
import * as fs from "fs";
import { Config } from "../config";
import * as http from "http";
import { SubscriptionServer } from 'subscriptions-transport-ws';

const schema = buildSchema(fs.readFileSync("app.graphql", "utf8"));

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const server = http.createServer(app as any);

new SubscriptionServer({ schema, execute, subscribe }, { server, path: "subscriptions" });

app.use("/graphql", graphqlExpress({
  schema,
}));
app.get("/graphiql", graphiqlExpress({ endpointURL: "/graphql" }));

server.listen(Config.server.port);
