import React, { FC, useEffect, useState } from "react";
import { NodeKey } from "graphology-types";
import Graph from "graphology";
import { circular } from "graphology-layout";
import {
  ControlsContainer,
  DegreeFilter,
  ForceAtlasControl,
  SigmaContainer,
  ZoomControl,
  useSigma,
  useRegisterEvents,
  useLoadGraph,
  useSetSettings,
} from "../sigma";
import { queryToState } from "../../core/queryState";
import { useLocation } from "react-router";
import config from "../../core/config";
import { PlainObject } from "sigma/types";

export interface NetworkProps {
  graph: Graph;
}

export const Sigma: React.FC<NetworkProps> = ({ graph }) => {
  const sigma = useSigma();
  const registerEvents = useRegisterEvents();
  const loadGraph = useLoadGraph();
  const setSettings = useSetSettings();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // rerenderer if module layout change
  const location = useLocation();
  const state = queryToState(new URLSearchParams(location.search));
  useEffect(() => {
    sigma.refresh();
  }, [state.modules]);

  // selection management
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    circular.assign(graph);
    loadGraph(graph);

    // Register the events
    registerEvents({
      enterNode: (event: { node: NodeKey }) => setHoveredNode(`${event.node}`),
      leaveNode: (event: { node: NodeKey }) => setHoveredNode(null),
      clickNode: (event: { node: NodeKey }) => {
        setSelectedNodes((oldSelection) => {
          let newSelection = new Set<string>();
          if (!oldSelection.has(event.node + "")) newSelection = new Set<string>([...oldSelection, "" + event.node]);
          else newSelection = new Set<string>([...oldSelection].filter((n) => n !== "" + event.node));
          return newSelection;
        });
      },
    });
  }, [graph]);
  useEffect(() => {
    const colorNode = (node: string, data: PlainObject): string => {
      const inScope: boolean = !!state.scope && !!state.scope[data.model] && state.scope[data.model].includes(node);
      const selected = selectedNodes.has(node);
      // selected
      if (selected) return "#000";
      //in scope
      if (inScope) return config.networkStyle.scopeColor;
      // default
      return config.models[data.model].color;
    };
    setSettings({
      nodeReducer: (node: any, data: any) => {
        const graph = sigma.getGraph();
        const newData = {
          ...data,
          color: colorNode(node, data),
          size: graph.degree(node) !== 0 ? Math.log(graph.degree(node)) : 1,
          highlighted: false,
        };
        if (hoveredNode) {
          if (node === hoveredNode || graph.neighbors(hoveredNode).includes(node)) newData.highlighted = true;
          else newData.color = "#E2E2E2";
        }
        return newData;
      },
      edgeReducer: (edge: any, data: any) => {
        const graph = sigma.getGraph();
        const newData = { ...data, hidden: false };
        if (hoveredNode && !graph.extremities(edge).includes(hoveredNode)) newData.hidden = true;
        return newData;
      },
    });
  }, [hoveredNode, setSettings, sigma, JSON.stringify(state.scope), selectedNodes]);

  return null;
};

export const Network: FC<NetworkProps> = ({ graph }) => {
  return (
    <SigmaContainer graphOptions={{ multi: true, type: "directed", allowSelfLoops: true }}>
      <Sigma graph={graph} />
      <ControlsContainer position={"bottom-right"}>
        <ZoomControl />
        <ForceAtlasControl autoRunFor={2000} />
      </ControlsContainer>
      <ControlsContainer position={"bottom-left"}>
        <DegreeFilter />
      </ControlsContainer>
    </SigmaContainer>
  );
};
