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
  stats: {
    users: number;
    posts: number;
    annotations: number;
    topics: number;
    codes: number;
  };
}

export type TableDataType = (string | number)[][];

/**
 * Data loading:
 * *************
 */
const GRAPHQL_GET_GRAPH = gql`
  query getGraphByCorpus($platform: String!, $corpora: String!) {
    graph: getGraphByCorpus(platform: $platform, corpora: $corpora) {
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
export async function loadDataset(platform: string, corpora: string, state: QueryState): Promise<DatasetType> {
  const graph = new Graph({ multi: true, type: "directed", allowSelfLoops: true });
  const result = await client.query({
    query: GRAPHQL_GET_GRAPH,
    variables: { platform, corpora },
  });
  graph.import(cloneDeep(result.data.graph));
  const stats = {
    users: 0,
    posts: 0,
    annotations: 0,
    topics: 0,
    codes: 0,
  };
  graph.forEachNode((key: string, attributes: any) => {
    if (attributes.labels.includes("user")) stats.users++;
    if (attributes.labels.includes("post")) stats.posts++;
    if (attributes.labels.includes("annotation")) stats.annotations++;
    if (attributes.labels.includes("topic")) stats.topics++;
    if (attributes.labels.includes("code")) stats.codes++;
  });
  return Promise.resolve({ graph, stats });
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
