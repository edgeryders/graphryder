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
import { QueryState, queryToState, stateToQueryString } from "../../core/queryState";
import { useLocation } from "react-router";
import config from "../../core/config";
import NodeWithCirclesProgram from "../sigma/node-with-circles/node-with-circles-program";
import drawHoverWithCircles from "../sigma/node-with-circles/node-with-circles-hover";
import { max, min, random, sortedUniq, sum, values } from "lodash";
import { NodeLegend } from "../sigma/controls/NodeLegend";
import { EdgeWeightFilter } from "../sigma/controls/EdgeWeightFilter";
import { useHistory } from "react-router-dom";
import { ExplorationMode } from "../sigma/controls/ExplorationMode";
import { SearchNode } from "../sigma/controls/SearchNodes";

export interface SigmaProps {
  graph: Graph;
  selectedNodes: ReadonlySet<string>;
  setSelectedNodes: React.Dispatch<React.SetStateAction<ReadonlySet<string>>>;
  setFA2Autorun: React.Dispatch<React.SetStateAction<number>>;
  cursor: string | undefined;
  setCursor: (cursor: string | undefined) => void;
}

export const Sigma: React.FC<SigmaProps> = ({
  graph,
  selectedNodes,
  setSelectedNodes,
  setFA2Autorun,
  cursor,
  setCursor,
}) => {
  const sigma = useSigma();
  const registerEvents = useRegisterEvents();
  const loadGraph = useLoadGraph();
  const setSettings = useSetSettings();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  // Deal with nodes drag and dropping:
  const [draggedNode, setDraggedNode] = useState<string | undefined>(undefined);
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
        enterNode: (event: { node: NodeKey }) => {
          setHoveredNode(`${event.node}`);
          // ENTER NODE : signify grabbing is possible through cursor
          if (draggedNode === undefined) setCursor("pointer");
        },
        leaveNode: (event: { node: NodeKey }) => {
          setHoveredNode(null);
          if (draggedNode === undefined) setCursor(undefined);
        },
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
        downNode: ({ node, event }) => {
          // TODO : add a check on FA2status here
          //if (this.state.isFA2Running) return;
          setCursor("grabbing");

          sigma.getGraph().setNodeAttribute(node, "fixed", true);
          sigma.getCamera().disable();
          setDraggedNode(node as string);
        },
      });
      const mouseCaptor = sigma.getMouseCaptor();
      // MOUSE UP : stop grabbing
      const mouseUp = (): void => {
        setCursor("pointer");
        setDraggedNode(undefined);
        sigma.getCamera().enable();
      };
      mouseCaptor.on("mouseup", mouseUp);
    } else {
      // merge sigmaGraph with incoming graph
      const triggerFA2 = graph.size !== sigmaGraph.size || graph.order !== sigmaGraph.order;

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
      const graphCenterX = ((max(currentXs) || 0) - (min(currentXs) || 0)) / 2;
      const graphCenterY = ((max(currentYs) || 0) - (min(currentYs) || 0)) / 2;
      // drop deprecated nodes
      deprecatedNodes.forEach((n) => {
        if (sigmaGraph.hasNode(n)) sigmaGraph.dropNode(n);
      });

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
          let x = xs.length > 0 ? sum(xs) / xs.length : graphCenterX;
          let y = ys.length > 0 ? sum(ys) / ys.length : graphCenterY;
          // count newNodes by neiborhood classe to detect colision
          const neighborhood = sortedUniq(neighbors).join("");
          newNodesByNeighborhood[neighborhood] = (newNodesByNeighborhood[neighborhood] || 0) + 1;
          // avoid overlap
          if (newNodesByNeighborhood[neighborhood] > 0) {
            // collision : same neighborhood => same x,y + same links => overlapping node in spacialisation
            // to avoid this we blur position around the centroid
            x += random(0.1, 0.8);
            y += random(0.1, 0.8);
          }
          sigmaGraph.addNode(n, { ...atts, x, y });
        } else {
          //update scope variables
          sigmaGraph.setNodeAttribute(n, "inScope", !!atts.inScope);
          sigmaGraph.setNodeAttribute(n, "inScopeArea", !!atts.inScopeArea);
        }
      });
      sigmaGraph.clearEdges();
      graph.forEachEdge((e, atts, src, trg) => sigmaGraph.addEdgeWithKey(e, src, trg, atts));
      // trigger FA2: autorun value is changed to force fa2 component to remount
      // TODO: would need a different components architecture to give sigma a proper control on FA2 process (fa2 container?)
      if (triggerFA2) setFA2Autorun((fa) => fa + 1);
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
        insideColor: data.inScope ? config.networkStyle.scopeColor : null,
      };
      if (hoveredNode) {
        if (node === hoveredNode || sigmaGraph.neighbors(hoveredNode).includes(node)) newData.highlighted = true;
        else newData.color = "#E2E2E2";
      }
      if (data.searchHighlight) {
        newData.highlighted = true;
      }

      return newData;
    };
    setSettings({
      nodeReducer,
      edgeReducer: (edge: any, data: any) => {
        const sigmaGraph = sigma.getGraph();
        const newData = { ...data, hidden: false };
        // hide edges not attached to hoverednode
        if (hoveredNode && !sigmaGraph.extremities(edge).includes(hoveredNode)) newData.hidden = true;
        return newData;
      },
      hoverRenderer: (context, data, settings) => {
        // reusing nodeReducer here as an issue in Sigma cause node attributes to be ignored in he hover renderer
        return drawHoverWithCircles(context, { ...nodeReducer(data.key, data), ...data }, settings);
      },
    });
  }, [hoveredNode, setSettings, sigma, JSON.stringify(state.scope), selectedNodes]);

  useEffect(() => {
    const mouseCaptor = sigma.getMouseCaptor();
    // MOUSE MOVE : change node position following mouse
    const mouseMove = (e: { x: number; y: number }) => {
      if (!sigma || draggedNode === undefined) return;
      if (sigma && draggedNode !== undefined) {
        // Get new position of node
        const pos = sigma.viewportToGraph(e);
        // apply new position on node
        const sigmaGraph = sigma.getGraph();
        sigmaGraph.setNodeAttribute(draggedNode, "x", pos.x);
        sigmaGraph.setNodeAttribute(draggedNode, "y", pos.y);
        setCursor("grabbing");
      }
    };
    mouseCaptor.on("mousemove", mouseMove);
    return () => {
      mouseCaptor.off("mousemove", mouseMove);
    };
  }, [draggedNode]);

  return null;
};

export type NetworkProps = {
  moduleId: string;
  graphData: { graph: Graph; edgeWeightBoundaries: { min: number; max: number } };
  model: string;
  state: QueryState;
  edgeWeightFilterLabel: string;
};

export const Network: FC<NetworkProps> = ({
  moduleId,
  graphData: { graph, edgeWeightBoundaries },
  model,
  state,
  edgeWeightFilterLabel,
}) => {
  const history = useHistory();

  // selection management
  const [selectedNodes, setSelectedNodes] = useState<ReadonlySet<string>>(new Set());
  const [FA2Autorun, setFA2Autorun] = useState<number>(2000);
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  // update state
  const updateEdgeWeightFilterInState = (value: number) => {
    history.push({
      search: stateToQueryString({
        ...state,
        modulesStates: {
          ...state.modulesStates,
          [moduleId]: { ...state.modulesStates[moduleId], weightFilter: "" + value },
        },
      }),
    });
  };
  const updateExplorationMode = (mode: string) => {
    history.push({
      search: stateToQueryString({
        ...state,
        modulesStates: {
          ...state.modulesStates,
          [moduleId]: {
            ...state.modulesStates[moduleId],
            mode,
          },
        },
      }),
    });
  };
  return (
    <SigmaContainer
      graphOptions={{ multi: true, type: "directed", allowSelfLoops: true }}
      initialSettings={{
        nodeProgramClasses: { circle: NodeWithCirclesProgram },
      }}
      style={{ cursor }} //TODO: implement a getCursor which decide which cursor to use depending on the state
    >
      <Sigma
        graph={graph}
        selectedNodes={selectedNodes}
        setSelectedNodes={setSelectedNodes}
        setFA2Autorun={setFA2Autorun}
        cursor={cursor}
        setCursor={setCursor}
      />
      <ControlsContainer position={"top-left"}>
        <SearchNode />
      </ControlsContainer>
      <ControlsContainer position={"top-right"}>
        <ZoomControl />
        <ForceAtlasControl autoRunFor={FA2Autorun} />
      </ControlsContainer>
      {edgeWeightBoundaries.min !== Infinity && (
        <ControlsContainer position={"bottom-right"}>
          <EdgeWeightFilter
            value={
              (state.modulesStates[moduleId] && +state.modulesStates[moduleId].weightFilter) || edgeWeightBoundaries.min
            }
            label={edgeWeightFilterLabel}
            min={edgeWeightBoundaries.min}
            max={edgeWeightBoundaries.max}
            onChange={updateEdgeWeightFilterInState}
          />
          <ExplorationMode
            model={model}
            checked={state.modulesStates[moduleId] && state.modulesStates[moduleId].mode}
            onChange={updateExplorationMode}
          />
        </ControlsContainer>
      )}
      <ControlsContainer position={"bottom-left"}>
        <div className="scope">
          <NodeLegend model={model} selectedIds={selectedNodes} state={state} setSelectedNodes={setSelectedNodes} />
        </div>
      </ControlsContainer>
    </SigmaContainer>
  );
};
