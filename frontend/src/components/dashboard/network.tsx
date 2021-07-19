import React, { FC, useEffect, useState } from "react";
import { NodeKey } from "graphology-types";
import Graph from "graphology";
import { circular } from "graphology-layout";
import {
  ControlsContainer,
  ForceAtlasControl,
  SigmaContainer,
  ZoomControl,
  useSigma,
  useRegisterEvents,
  useLoadGraph,
  useSetSettings,
} from "react-sigma-v2";
import { QueryState, queryToState } from "../../core/queryState";
import { useLocation } from "react-router";
import config from "../../core/config";
import NodeWithCirclesProgram from "../sigma/node-with-circles/node-with-circles-program";
import drawHoverWithCircles from "../sigma/node-with-circles/node-with-circles-hover";
import { random, sortedUniq, sum, values } from "lodash";
import { PlainObject } from "sigma/types";
import { NodeLegend } from "../sigma/controls/NodeLegend";
import { DegreeFilter } from "../sigma/controls/EdgeWeightFilter";

export interface SigmaProps {
  graph: Graph;
  selectedNodes: ReadonlySet<string>;
  setSelectedNodes: React.Dispatch<React.SetStateAction<ReadonlySet<string>>>;
  setFA2Autorun: React.Dispatch<React.SetStateAction<number>>;
}

export const Sigma: React.FC<SigmaProps> = ({ graph, selectedNodes, setSelectedNodes, setFA2Autorun }) => {
  const sigma = useSigma();
  const registerEvents = useRegisterEvents();
  const loadGraph = useLoadGraph();
  const setSettings = useSetSettings();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // rerenderer if module layout changed
  const location = useLocation();
  const state = queryToState(new URLSearchParams(location.search));
  useEffect(() => {
    sigma.refresh();
  }, [JSON.stringify(state.modules)]);

  // Load data
  useEffect(() => {
    const sigmaGraph = sigma.getGraph();

    if (sigmaGraph.order === 0) {
      // first initalisation
      circular.assign(graph);
      loadGraph(graph);
      // Register the events
      registerEvents({
        enterNode: (event: { node: NodeKey }) => setHoveredNode(`${event.node}`),
        leaveNode: (event: { node: NodeKey }) => setHoveredNode(null),
        clickNode: (event: { node: NodeKey }) => {
          setSelectedNodes((oldSelection: ReadonlySet<string>) => {
            let newSelection: ReadonlySet<string> = new Set<string>() as ReadonlySet<string>;
            if (!oldSelection.has(event.node + ""))
              newSelection = new Set<string>([...oldSelection, "" + event.node]) as ReadonlySet<string>;
            else
              newSelection = new Set<string>(
                [...oldSelection].filter((n) => n !== "" + event.node),
              ) as ReadonlySet<string>;
            return newSelection;
          });
        },
      });
    } else {
      // merge sigmaGraph with incoming graph

      const deprecatedNodes: string[] = [];
      const currentXs: number[] = [];
      const currentYs: number[] = [];
      sigmaGraph.forEachNode((n, atts) => {
        if (!graph.hasNode(n)) deprecatedNodes.push(n);
        else {
          // store position for default centroïd
          currentXs.push(atts.x);
          currentYs.push(atts.y);
        }
      });
      // drop deprecated nodes
      deprecatedNodes.forEach((n) => {
        if (sigmaGraph.hasNode(n)) sigmaGraph.dropNode(n);
      });
      const edgesToMerge: { [key: string]: [string, string, string, PlainObject] } = {};
      let newNodesByNeighborhood: { [key: string]: number } = {};
      graph.forEachNode((n, atts) => {
        if (!sigmaGraph.hasNode(n)) {
          // define position
          // TODO: use edge weight to weight the centroid position
          const neighbors: string[] = [];
          let { xs, ys } = graph.neighbors(n).reduce(
            (pos: { xs: number[]; ys: number[] }, nn: string) => {
              neighbors.push(nn);
              if (sigmaGraph.hasNode(nn)) {
                return {
                  xs: [...pos.xs, sigmaGraph.getNodeAttribute(nn, "x")],
                  ys: [...pos.ys, sigmaGraph.getNodeAttribute(nn, "y")],
                };
              } else return pos;
            },
            { xs: [], ys: [] },
          );

          // new nodes are placed on neighbors centroïd if exists
          // otherwise on the current graph centroïd
          let x = xs.length > 0 ? sum(xs) / xs.length : currentXs.length > 0 ? sum(currentXs) / currentXs.length : 0;
          let y = ys.length > 0 ? sum(ys) / ys.length : currentYs.length > 0 ? sum(currentYs) / currentYs.length : 0;
          // count newNodes by neiborhood classe to detect colision
          const neighborhood = sortedUniq(neighbors).join("");
          newNodesByNeighborhood[neighborhood] = (newNodesByNeighborhood[neighborhood] || 0) + 1;
          // avoid overlap
          if (newNodesByNeighborhood[neighborhood] > 1) {
            // collision : same neighborhood => same x,y + same links => overlapping node in spacialisation
            // to avoid this we blur position around the centroid
            x += random(0.1, 0.8);
            y += random(0.1, 0.8);
          }
          sigmaGraph.addNode(n, { ...atts, x, y });
          // merge associated edges

          graph.forEachEdge(n, (e, eAtts, src, trg) => (edgesToMerge[e] = [e, src, trg, eAtts]));
        }
      });
      const nbNewNodes = sum(values(newNodesByNeighborhood));
      values(edgesToMerge).forEach((args) => sigmaGraph.addEdgeWithKey(...args));
      // there is no need to merge other edges than the ones attached to new nodes, they must be already there
      // trigger FA2: autorun value is changed to force fa2 component to remount
      // TODO: would need a different components architecture to give sigma a proper control on FA2 process (fa2 container?)
      if (nbNewNodes > 0) setFA2Autorun((fa) => fa + 1);
    }
  }, [graph]);

  useEffect(() => {
    // affect rendering from state
    //nodeReducer has be reused in hoverRenderer until a sigma issue is resolved
    const nodeReducer = (node: any, data: any) => {
      const sigmaGraph = sigma.getGraph();
      // the model attributes has to be reloaded from graph until the sigma issue around hoverRenderer is resolved
      const model = sigmaGraph.getNodeAttribute(node, "model");
      const newData: any = {
        ...data,
        color: config.models[model].color,
        size: sigmaGraph.degree(node) !== 0 ? Math.log(sigmaGraph.degree(node)) : 1,
        highlighted: false,
        dotColor: selectedNodes.has(node) ? config.networkStyle.selectColor : null,
        insideColor:
          !!state.scope && !!state.scope[model] && state.scope[model].includes(node)
            ? config.networkStyle.scopeColor
            : null,
      };
      if (hoveredNode) {
        if (node === hoveredNode || sigmaGraph.neighbors(hoveredNode).includes(node)) newData.highlighted = true;
        else newData.color = "#E2E2E2";
      }
      return newData;
    };
    setSettings({
      nodeReducer,
      edgeReducer: (edge: any, data: any) => {
        const sigmaGraph = sigma.getGraph();
        const newData = { ...data, hidden: false };
        if (hoveredNode && !sigmaGraph.extremities(edge).includes(hoveredNode)) newData.hidden = true;
        return newData;
      },
      hoverRenderer: (context, data, settings) => {
        // reusing nodeReducer here as an issue in Sigma cause node attributes to be ignored in he hover renderer
        return drawHoverWithCircles(context, { ...nodeReducer(data.key, data), ...data }, settings);
      },
    });
  }, [hoveredNode, setSettings, sigma, JSON.stringify(state.scope), selectedNodes]);

  return null;
};

export type NetworkProps = {
  graphData: { graph: Graph; edgeWeightBoundaries: { min: number; max: number } };
  model: string;
  state: QueryState;
};

export const Network: FC<NetworkProps> = ({ graphData: { graph, edgeWeightBoundaries }, model, state }) => {
  // selection management
  const [selectedNodes, setSelectedNodes] = useState<ReadonlySet<string>>(new Set());
  const [FA2Autorun, setFA2Autorun] = useState<number>(2000);
  return (
    <SigmaContainer
      graphOptions={{ multi: true, type: "directed", allowSelfLoops: true }}
      initialSettings={{
        nodeProgramClasses: { circle: NodeWithCirclesProgram },
      }}
    >
      <Sigma
        graph={graph}
        selectedNodes={selectedNodes}
        setSelectedNodes={setSelectedNodes}
        setFA2Autorun={setFA2Autorun}
      />
      <ControlsContainer position={"top-right"}>
        <ZoomControl />
        <ForceAtlasControl autoRunFor={FA2Autorun} />
      </ControlsContainer>
      <ControlsContainer position={"bottom-right"}>
        {/* graph props is added only to recyl */}
        <DegreeFilter min={edgeWeightBoundaries.min} max={edgeWeightBoundaries.max} />
      </ControlsContainer>
      <ControlsContainer position={"bottom-left"}>
        <div className="scope">
          <NodeLegend model={model} selectedIds={selectedNodes} state={state} setSelectedNodes={setSelectedNodes} />
        </div>
      </ControlsContainer>{" "}
      :
    </SigmaContainer>
  );
};
