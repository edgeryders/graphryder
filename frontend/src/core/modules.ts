import { ComponentType } from "react";

import { QueryState } from "./queryState";
import { DatasetType, getGraph, getTableData } from "./data";
import { Table, TableProps } from "../components/dashboard/table";
import { Network, NetworkProps } from "../components/dashboard/network";

export interface ModuleType {
  id: string;
  title: string;
  component: ComponentType<any>;
  getProps(state: QueryState, dataset: DatasetType): unknown;
}

export const Modules: Record<string, ModuleType> = {
  cn: {
    id: "codesNetworks",
    title: "Codes network",
    component: Network,
    getProps: (state, dataset): NetworkProps => ({
      graph: getGraph(dataset, {
        /*TODO*/
      }),
    }),
  },
  un: {
    id: "participantsNetworks",
    title: "Participants network",
    component: Network,
    getProps: (state, dataset): NetworkProps => ({
      graph: getGraph(dataset, {
        /*TODO*/
      }),
    }),
  },
  ct: {
    id: "codesTable",
    title: "Codes table",
    component: Table,
    getProps: (state, dataset): TableProps => ({
      data: getTableData(dataset, {
        /*TODO*/
      }),
    }),
  },
};
