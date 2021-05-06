import Graph from "graphology";
import { cloneDeep, memoize } from "lodash";
import gql from "graphql-tag";
import { client } from "./client";

import { QueryState } from "./queryState";

/**
 * Data types:
 * ***********
 */

export interface DatasetType {
  graph: Graph;
}

export type TableDataType = (string | number)[][];

/**
 * Data loading:
 * *************
 */
const GRAPHQL_GET_GRAPH = gql`
  query getGraphByCorpus($platform: String!, $corpus: String!) {
    graph: getGraphByCorpus(platform: $platform, corpus: $corpus) {
      attributes
      nodes {
        key
        attributes
      }
      edges {
        key
        source
        target
        attributes
      }
    }
  }
`;
export async function loadDataset(platform: string, corpus: string, state: QueryState): Promise<DatasetType> {
  const graph = new Graph({ multi: true, type: "directed", allowSelfLoops: true });
  const result = await client.query({
    query: GRAPHQL_GET_GRAPH,
    variables: { platform, corpus },
  });
  graph.import(cloneDeep(result.data.graph));
  return Promise.resolve({ graph });
}

/**
 * Data types translation / extraction:
 * ************************************
 */

function getGraphNaive(dataset: DatasetType, options: unknown): Graph {
  return dataset.graph;
}

function getTableDataNaive(dataset: DatasetType, options: unknown): TableDataType {
  // TODO
  return [];
}

// TODO:
// Check that memoize key is good (and rewrite if needed)
export const getGraph = memoize(getGraphNaive);
export const getTableData = memoize(getTableDataNaive);
