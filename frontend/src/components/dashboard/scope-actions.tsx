import React, { FC } from "react";
import { useHistory, useLocation } from "react-router";
import { GoDiffAdded, GoDiffRemoved } from "react-icons/go";
import { QueryState, stateToQueryString } from "../../core/queryState";

export interface ScopeActionsprops {
  model: string;
  selectedIds: ReadonlySet<string>;
  state: QueryState;
}

export const ScopeActions: FC<ScopeActionsprops> = (props: ScopeActionsprops) => {
  const { model, selectedIds, state } = props;

  const history = useHistory();

  const scope = state.scope && state.scope[model];

  // SCOPE management
  const scopeIdsSet = new Set(scope);
  const selectedNotInScope = new Set<string>();
  const selectedInScope = new Set<string>();
  for (const id of selectedIds) {
    if (scopeIdsSet.has(id)) selectedInScope.add(id);
    else selectedNotInScope.add(id);
  }

  return (
    <div className="scope-actions">
      <button
        className="btn btn-primary"
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
        </i>{" "}
        {selectedNotInScope.size} selected not in scope{" "}
      </button>
      <button
        className="btn btn-primary"
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
          <GoDiffRemoved />
        </i>{" "}
        {selectedInScope.size} selected already in scope{" "}
      </button>
    </div>
  );
};
