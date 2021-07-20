import Graph from "graphology";
import { updateGraphKeys } from "graphology-utils";
import { cloneDeep, memoize } from "lodash";
import gql from "graphql-tag";
import { client } from "./client";
import config from "./config";
import { QueryState } from "./queryState";
import { PlainObject } from "sigma/types";
import { Scope, TableColumn } from "../types";

/**
 * Data types:
 * ***********
 */

export interface DatasetType {
  graph: Graph;
  // number of nodes by label for legends
  nodeStats: { [key: string]: number };
  // number of nodes by label in scope area for legends
  inScopeAreaStats?: { [key: string]: number };
}

export type TableDataType = {
  rows: PlainObject[];
  columns: TableColumn[];
  label: string;
};

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
  // Construct the graph from the graphql query
  const result = await client.query({
    query: GRAPHQL_GET_GRAPH,
    variables: { platform, corpora },
  });
  const graphReceived = new Graph({ multi: true, type: "directed", allowSelfLoops: true });
  graphReceived.import(cloneDeep(result.data.graph));

  // change ids of the graph : replace neo4j one by business one
  const graph = updateGraphKeys(
    graphReceived,
    (key, attr) => `${attr["@labels"].join("|")}_${attr.discourse_id}`,
    (key) => key,
  );

  // Compute graph stats and style
  const nodeStats: { [key: string]: number } = {};
  graph.forEachNode((key: string, attributes: any) => {
    Object.keys(config.models).forEach((label) => {
      if (attributes["@labels"] && attributes["@labels"].includes(label)) {
        // compute stats
        nodeStats[label] = (nodeStats[label] || 0) + 1;
        // set graph style
        graph.setNodeAttribute(key, "model", label);
        graph.setNodeAttribute(key, "color", config.models[label].color);
        graph.setNodeAttribute(key, "label", attributes[config.models[label].label_field]);
      }
    });
  });

  return Promise.resolve({ graph, nodeStats });
}

/**
 * Scope application on dataset:
 * ************************************
 */

// graph traversal utils
const postInCodeScope = (graph: Graph, codeScope: string[] | undefined, post: string | null): boolean => {
  return (
    !codeScope ||
    (!!post &&
      graph.inEdges(post).some((inLinkPost) => {
        const anotation = graph.getEdgeAttribute(inLinkPost, "@type") === "ANNOTATES" ? graph.source(inLinkPost) : null;
        return (
          anotation &&
          graph.outEdges(anotation).some((outLinkAnot) => {
            const code =
              graph.getEdgeAttribute(outLinkAnot, "@type") === "REFERS_TO" ? graph.target(outLinkAnot) : null;
            // does tu user created a post which was annotated by a scope code?
            return code && codeScope.includes(code);
          })
        );
      }))
  );
};
const postInUserScope = (graph: Graph, userScope: string[] | undefined, post: string | null): boolean => {
  return (
    !userScope ||
    (!!post &&
      graph.inEdges(post).some((inLinkPost) => {
        // post <- [:CREATED] - user
        // was this post created by a scope.user?
        return (
          graph.getEdgeAttribute(inLinkPost, "@type") === "CREATED" && userScope.includes(graph.source(inLinkPost))
        );
      }))
  );
};
/**
 * This method adds a inScope attribute to input graph's nodes
 * @param graph
 * @param scope
 *
 */
export const applyScopeOnGraph = (
  graph: Graph,
  scope: Scope | undefined,
): { graph: Graph; inScopeAreaStats: { [key: string]: number } } => {
  const newGraph = graph.copy();
  const inScopeStats: { [key: string]: number } = {};
  newGraph.forEachNode((node, nodeAtts) => {
    // by default nodes are considered in scope area (i.e. cooccurre with some "inScope" nodes)
    let inScopeArea: boolean = true;
    if (scope) {
      // scope application on code nodes
      if (nodeAtts.model === "code" && (scope.user || scope.post))
        inScopeArea = newGraph.inNeighbors(node).some((annotation) => {
          // does the node has an annotation ?
          if (newGraph.getNodeAttribute(annotation, "@labels").includes("annotation")) {
            // code <- Anotation -> post
            const posts = newGraph.outNeighbors(annotation);
            return (
              // does posts contains a scope.post?
              (!scope.post || posts.some((post) => scope.post.includes(post))) && // This AND could a OR depending on how we want multiscope variable to be cumulative or assortative
              // was on of posts created by a scope.user ?
              (!scope.user || posts.some((post) => postInUserScope(newGraph, scope.user, post)))
            );
          }
          return false;
        });
      // scope application on user node
      if (nodeAtts.model === "user" && (scope.code || scope.post))
        inScopeArea = newGraph.outEdges(node).some((outLinkUser) => {
          // user - [:CREATED] -> post
          const post =
            newGraph.getEdgeAttribute(outLinkUser, "@type") === "CREATED" ? newGraph.target(outLinkUser) : null;
          // does the user has created posts  ?
          return (
            (!scope.post || (post && scope.post.includes(post))) && // This AND could a OR depending on how we want multiscope variable to be cumulative or assortative
            // post <- anotation -> code
            postInCodeScope(newGraph, scope.code, post)
          );
        });
      // scope application on post node
      if (nodeAtts.model === "post" && (scope.code || scope.user)) {
        inScopeArea =
          // post <- [:CREATED] - user
          postInUserScope(newGraph, scope.user, node) && // This AND could a OR depending on how we want multiscope variable to be cumulative or assortative
          // post <- anotation -> code
          postInCodeScope(newGraph, scope.code, node);
      }
    }
    // compute stats
    if (inScopeArea) inScopeStats[nodeAtts.model] = (inScopeStats[nodeAtts.model] || 0) + 1;
    // store the flag as node property
    newGraph.setNodeAttribute(node, "inScopeArea", inScopeArea);
  });
  //todo: detect if graph has changed?
  return { graph: newGraph, inScopeAreaStats: inScopeStats };
};

/**
 * Data types translation / extraction:
 * ************************************
 */
const keepNodesFromOption = (graph: Graph, options: GraphOptions) => (node: string, nodeAtts: PlainObject): boolean => {
  const { nodeLabels } = options;
  // keep only nodes asked in options though label filter
  if (
    nodeLabels.length === 0 ||
    (nodeLabels.length !== 0 && !nodeLabels.some((t: string) => nodeAtts["@labels"].includes(t)))
  )
    return false;

  // we use the inScope attribute computed by the dashboard component through applyScopeOnGraph method
  // no scope or no scope applied => we keep the node
  return "inScopeArea" in nodeAtts ? nodeAtts.inScopeArea : true;
};

export interface GraphOptions {
  nodeLabels: string[];
  edgeTypes?: string[];
}

function filterGraph(
  dataset: DatasetType,
  options: GraphOptions,
): { graph: Graph; edgeWeightBoundaries: { min: number; max: number } } {
  const graph = new Graph({ type: "directed", allowSelfLoops: true });
  // utils
  const keepNode = keepNodesFromOption(dataset.graph, options);
  const keepEdge = (edgeAtts: PlainObject): boolean =>
    !!options.edgeTypes && (options.edgeTypes.length === 0 || options.edgeTypes.includes(edgeAtts["@type"]));

  // iterate first on nodes to keep isolated node into filtered graph
  dataset.graph.forEachNode((node, atts) => {
    if (keepNode(node, atts)) {
      graph.addNode(node, atts);
    }
  });
  const edgeWeightBoundaries = { min: Infinity, max: -Infinity };
  graph.forEachNode((node) => {
    dataset.graph.forEachOutEdge(node, (edge, atts, source, target, sourceAtts, targetAtts) => {
      try {
        if (graph.hasNode(source) && graph.hasNode(target) && keepEdge(atts)) {
          graph.addEdgeWithKey(edge, source, target, atts);
          if (atts.count) {
            edgeWeightBoundaries.min = Math.min(edgeWeightBoundaries.min, atts.count);
            edgeWeightBoundaries.max = Math.max(edgeWeightBoundaries.max, atts.count);
          }
        }
      } catch (e) {
        console.error(`duplicated edge ${edge}`);
        console.debug(edge, source, target, graph.edge(source, target), graph.getEdgeAttributes(source, target), atts);
      }
    });
  });
  console.debug(
    `fitlered dataset graph (${dataset.graph.size} ${dataset.graph.order}) to ${graph.size} ${graph.order} weight [${
      edgeWeightBoundaries.min
    },${edgeWeightBoundaries.max}]using ${JSON.stringify(options, undefined, 2)}`,
  );
  return { graph, edgeWeightBoundaries };
}

export interface TableOptions {
  nodeLabel: string;
  scope: Scope | undefined;
}

function getTableDataNaive(dataset: DatasetType, options: TableOptions): TableDataType {
  // column preparation
  const columnsFromAttributes = (node: string, nodeAttributes: PlainObject): PlainObject =>
    config.models[options.nodeLabel].tableColumns.reduce((columns, column) => {
      if (nodeAttributes[column.property]) return { ...columns, [column.property]: nodeAttributes[column.property] };
      else if (column.generateFromNode)
        return { ...columns, [column.property]: column.generateFromNode(dataset.graph, node) };
      else return columns;
    }, {});
  // utils
  const keepNode = keepNodesFromOption(dataset.graph, { nodeLabels: [options.nodeLabel] });
  const tableData: PlainObject[] = [];
  dataset.graph.forEachNode((n, atts) => {
    if (keepNode(n, atts)) {
      tableData.push({ key: n, ...columnsFromAttributes(n, atts) });
    }
  });
  return { label: options.nodeLabel, rows: tableData, columns: config.models[options.nodeLabel].tableColumns };
}

// TODO:
// Check that memoize key is good (and rewrite if needed)
export const getGraph = memoize(filterGraph, (dataset, options) =>
  JSON.stringify({ stats: dataset.nodeStats, inScopeAreaStats: dataset.inScopeAreaStats, ...options }),
);
export const getTableData = memoize(getTableDataNaive, (dataset, options) =>
  JSON.stringify({ stats: dataset.nodeStats, inScopeAreaStats: dataset.inScopeAreaStats, ...options }),
);
