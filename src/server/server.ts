import express from 'express';
import bodyParser from 'body-parser';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { buildSchema } from "graphql";
import * as fs from "fs";
import { Config } from "../config";

const myGraphQLSchema = buildSchema(fs.readFileSync("app.graphql", "utf8"));

const app = express();

app.use("/graphql", bodyParser.json(), graphqlExpress({ schema: myGraphQLSchema }));
app.get("/graphiql", graphiqlExpress({ endpointURL: "/graphql" }));

app.listen(Config.server.port);