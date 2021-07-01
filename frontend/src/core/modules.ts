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
  getProps(state: QueryState, dataset: DatasetType): NetworkProps | TableProps;
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
      // uggly cause to Scope Type beeing a PlainObject where it should use ModelType as key type
      model: "code",
      state,
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
        nodeLabels: ["user"],
        edgeTypes: ["TALKED_OR_QUOTED"],
      }),
      model: "user",
      state,
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
        nodeLabel: "code",
        scope: state.scope,
      }),
      state,
    }),
  },
  ul: {
    id: "ul",
    title: "User list",
    description: "Explores the users in the conversation, filtered by your selections of codes and participants",
    model: config.models.user,
    component: Table,
    visible: false,
    getProps: (state, dataset): TableProps => ({
      data: getTableData(dataset, {
        nodeLabel: "user",
        scope: state.scope,
      }),
      state,
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
        nodeLabel: "post",
        scope: state.scope,
      }),
      state,
    }),
  },
};
