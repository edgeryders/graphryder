import React, { FC } from "react";
import { useHistory } from "react-router";
import { GoDiffAdded, GoDiffRemoved } from "react-icons/go";
import { MdSelectAll } from "react-icons/md";
import { QueryState, stateToQueryString } from "../../../core/queryState";
import config from "../../../core/config";
import { TiCancel } from "react-icons/ti";
import { useSigma } from "react-sigma-v2/lib/esm";

export interface ScopeActionsprops {
  model: string;
  selectedIds: ReadonlySet<string>;
  state: QueryState;
  setSelectedNodes: React.Dispatch<React.SetStateAction<ReadonlySet<string>>>;
}
//TODO: selected and inScope inner dots factor size should be in config
const Node: FC<{ size: number; model: string; selected?: boolean; inScope?: boolean }> = ({
  size,
  model,
  selected,
  inScope,
}) => (
  <div
    style={{
      position: "relative",
      width: size,
      height: size,
      backgroundColor: config.models[model].color,
      borderRadius: size,
    }}
  >
    {inScope && (
      <div
        style={{
          position: "absolute",
          top: (size - size * 0.7) / 2,
          left: (size - size * 0.7) / 2,
          width: size * 0.7,
          height: size * 0.7,
          backgroundColor: config.networkStyle.scopeColor,
          borderRadius: size * 0.7,
          margin: "auto",
        }}
      ></div>
    )}

    {selected && (
      <div
        style={{
          position: "absolute",
          top: (size - size * 0.3) / 2,
          left: (size - size * 0.3) / 2,
          width: size * 0.3,
          height: size * 0.3,
          backgroundColor: config.networkStyle.selectColor,
          borderRadius: size * 0.3,
          margin: "auto",
        }}
      ></div>
    )}
  </div>
);

export const NodeLegend: FC<ScopeActionsprops> = (props: ScopeActionsprops) => {
  const { model, selectedIds, state, setSelectedNodes } = props;

  const history = useHistory();
  const sigma = useSigma();

  const scope = state.scope && state.scope[model];

  // SCOPE management
  const scopeIdsSet = new Set(scope);
  const selectedNotInScope = new Set<string>();
  const selectedInScope = new Set<string>();
  for (const id of selectedIds) {
    if (scopeIdsSet.has(id)) selectedInScope.add(id);
    else selectedNotInScope.add(id);
  }
  const size: number = 20;
  return (
    <div className="react-node-legend">
      <div>
        <Node model={model} size={size} />
        <span className="legend-label">{model}s</span>
      </div>
      <div>
        <Node model={model} size={size} inScope={true} />
        <span className="legend-label">in scope</span>
      </div>
      <div>
        <Node model={model} size={size} selected={true} />
        <div className="legend-label">
          <span>
            {selectedNotInScope.size} selected
            <br /> not in scope
          </span>
          <button
            className="btn btn-link legend-label"
            disabled={selectedNotInScope.size === 0}
            onClick={() => {
              // ADD selected to scope
              history.push({
                search: stateToQueryString({
                  ...state,
                  scope: {
                    ...state.scope,
                    [model]: [...(scope || []), ...selectedNotInScope],
                  },
                }),
              });
            }}
          >
            <i>
              <GoDiffAdded />
            </i>
          </button>
        </div>
      </div>
      <div>
        <Node model={model} size={size} selected={true} inScope={true} />
        <div className="legend-label">
          <span>
            {selectedInScope.size} selected
            <br /> already in scope
          </span>
          <button
            className="btn btn-link"
            title="remove from scope"
            disabled={selectedInScope.size === 0}
            onClick={() => {
              history.push({
                search: stateToQueryString({
                  ...state,
                  scope: {
                    ...state.scope,
                    [model]: (scope || []).filter((id) => !selectedInScope.has(id)),
                  },
                }),
              });
            }}
          >
            <i>
              <GoDiffRemoved />{" "}
            </i>
          </button>
        </div>
      </div>
      <div>
        <button
          className="selection-action btn btn-link"
          onClick={() => {
            const visibleNodes = new Set<string>();
            const graph = sigma.getGraph();
            graph.forEachNode((n, atts) => {
              if (!atts.hidden) visibleNodes.add(n);
            });
            setSelectedNodes(visibleNodes);
          }}
          title="Select all visible nodes"
        >
          <i>
            <MdSelectAll />
          </i>
          select all nodes
        </button>
      </div>
      {selectedIds.size > 0 && (
        <div>
          <button
            className="selection-action btn btn-link"
            onClick={() => setSelectedNodes(new Set())}
            title="Cancel selection"
          >
            <i>
              <TiCancel />
            </i>
            cancel selection
          </button>
        </div>
      )}
    </div>
  );
};
