import { ApolloClient, InMemoryCache } from "@apollo/client";

import config from "./config";

// Apollo Client
export const client = new ApolloClient({
  cache: new InMemoryCache(),
  uri: config.graphql.http,
  queryDeduplication: false,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "cache-and-network",
    },
  },
});
