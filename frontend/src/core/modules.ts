import { ComponentType } from "react";

import { QueryState } from "./queryState";
import { DatasetType, getGraph, getTableData } from "./data";
import { Table, TableProps } from "../components/dashboard/table";
import { Network, NetworkProps } from "../components/dashboard/network";
import { ModelType } from "../types";
import config from "./config";

export interface ModuleType {
  id: string;
  title: string;
  description: string;
  visible: boolean;
  model: ModelType;
  component: ComponentType<any>;
  getProps(state: QueryState, dataset: DatasetType): unknown;
}

export const Modules: Record<string, ModuleType> = {
  cn: {
    id: "cn",
    title: "Codes network",
    description: "Explore how the code are related to each other.",
    component: Network,
    model: config.models.code,
    visible: false,
    getProps: (state, dataset): NetworkProps => ({
      graph: getGraph(dataset, {
        nodeLabels: ["code"],
        edgeTypes: ["COOCCURS"],
      }),
    }),
  },
  pi: {
    id: "pi",
    title: "Participant interactions",
    description: "Explore how the participants of this conversation have interacted with each other.",
    model: config.models.user,
    component: Network,
    visible: false,
    getProps: (state, dataset): NetworkProps => ({
      graph: getGraph(dataset, {
        nodeLabels: ["user", "post", "topic"],
        edgeTypes: ["TALKED_OR_QUOTED", "CREATED", "LIKES", "CREATED", "IN_TOPIC"],
      }),
    }),
  },
  cl: {
    id: "cl",
    title: "Code list",
    description: "Explores the codes used to annotates this conversation and to which topics they have been applied",
    model: config.models.code,
    component: Table,
    visible: false,
    getProps: (state, dataset): TableProps => ({
      data: getTableData(dataset, {
        /*TODO*/
      }),
    }),
  },
  ctl: {
    id: "ctl",
    title: "Content list",
    description:
      "Explores the posts and topics in the conversation, filtered by your selections of codes and participants",
    model: config.models.post,
    component: Table,
    visible: false,
    getProps: (state, dataset): TableProps => ({
      data: getTableData(dataset, {
        /*TODO*/
      }),
    }),
  },
};
