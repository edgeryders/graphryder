import Graph from "graphology";
import { memoize } from "lodash";
import {} from "@apollo/client";

import { QueryState } from "./queryState";

/**
 * Data types:
 * ***********
 */

export interface DatasetType {
  // TODO
}

export type TableDataType = (string | number)[][];

/**
 * Data loading:
 * *************
 */

export function loadDataset(platform: string, corpora: string, state: QueryState): Promise<DatasetType> {
  // TODO
  return Promise.resolve({});
}

/**
 * Data types translation / extraction:
 * ************************************
 */

function getGraphNaive(dataset: DatasetType, options: unknown): Graph {
  // TODO
  return new Graph();
}

function getTableDataNaive(dataset: DatasetType, options: unknown): TableDataType {
  // TODO
  return [];
}

// TODO:
// Check that memoize key is good (and rewrite if needed)
export const getGraph = memoize(getGraphNaive);
export const getTableData = memoize(getTableDataNaive);
