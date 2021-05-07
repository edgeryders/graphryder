import { ComponentType } from "react";

import { QueryState } from "./queryState";
import { DatasetType, getGraph, getTableData } from "./data";
import { Table, TableProps } from "../components/dashboard/table";
import { Network, NetworkProps } from "../components/dashboard/network";

export interface ModuleType {
  id: string;
  title: string;
  description: string;
  color: string;
  component: ComponentType<any>;
  getProps(state: QueryState, dataset: DatasetType): unknown;
}

export const Modules: Record<string, ModuleType> = {
  cn: {
    id: "codesNetworks",
    title: "Codes network",
    description: "",
    color: "#C90303",
    component: Network,
    getProps: (state, dataset): NetworkProps => ({
      graph: getGraph(dataset, {
        /*TODO*/
      }),
    }),
  },
  pi: {
    id: "participantInteractions",
    title: "Participant interactions",
    description: "Explore how the participants of this conversation have interacted with each other.",
    color: "#00CA00",
    component: Network,
    getProps: (state, dataset): NetworkProps => ({
      graph: getGraph(dataset, {
        /*TODO*/
      }),
    }),
  },
  cl: {
    id: "codeList",
    title: "Code list",
    description: "Explores the codes used to annotates this conversation and to which topics they have been applied",
    color: "#B60DFF",
    component: Table,
    getProps: (state, dataset): TableProps => ({
      data: getTableData(dataset, {
        /*TODO*/
      }),
    }),
  },
  ctl: {
    id: "coontentList",
    title: "Content list",
    description:
      "Explores the posts and topics in the conversation, filtered by your selections of codes and participants",
    color: "#F98E24",
    component: Table,
    getProps: (state, dataset): TableProps => ({
      data: getTableData(dataset, {
        /*TODO*/
      }),
    }),
  },
};
