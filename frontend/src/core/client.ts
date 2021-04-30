import { ApolloClient, ApolloLink, createHttpLink, InMemoryCache, split } from "@apollo/client";
import { WebSocketLink } from "@apollo/client/link/ws";
import { getMainDefinition } from "@apollo/client/utilities";
import { mapValues, omit } from "lodash";

import config from "./config";

function omitDeep(obj: object, keys: string[]): object {
  return mapValues(omit(obj, keys), (v) => (typeof v === "object" ? omitDeep(v, keys) : v));
}

// Remove the __typename from the request/response
const cleanTypenameLink = new ApolloLink((operation, forward) => {
  if (operation.variables && !operation.variables.file) {
    operation.variables = omitDeep(operation.variables, ["__typename"]);
  }
  return forward(operation);
});

// Create a http link apollo
const httpLink = createHttpLink({
  uri: config.graphql.http,
});

// Create a webscoket link
const wsLink = new WebSocketLink({
  uri: config.graphql.ws,
  options: {
    reconnect: false,
  },
});

// Links for routing queries to http or ws
const link = cleanTypenameLink.concat(
  split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return definition.kind === "OperationDefinition" && definition.operation === "subscription";
    },
    wsLink,
    httpLink,
  ),
);

// Apollo Client
export const client = new ApolloClient({
  link: link,
  queryDeduplication: true,
  cache: new InMemoryCache(),
});
