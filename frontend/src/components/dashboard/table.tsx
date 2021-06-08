import React, { FC, useMemo, useState } from "react";
import DataGrid, { SortColumn, SelectColumn } from "react-data-grid";
import { useHistory, useLocation } from "react-router";
import { PlainObject } from "sigma/types";

import { GoDiffAdded, GoDiffRemoved } from "react-icons/go";

import { TableDataType } from "../../core/data";
import { queryToState, stateToQueryString } from "../../core/queryState";

export interface TableProps {
  data: TableDataType;
}

type Comparator = (a: PlainObject, b: PlainObject) => number;
function getComparator(sortColumn: string): Comparator {
  return (a, b) => {
    if (typeof a[sortColumn] === "number" && typeof b[sortColumn] === "number") return a[sortColumn] - b[sortColumn];
    // fallback to cast to string...
    else return (a[sortColumn] + "").localeCompare("" + b[sortColumn]);
  };
  // TODO: define sort on column type
  // switch (sortColumn) {
  //   case 'string':
  //     return (a, b) => {
  //       return a[sortColumn].localeCompare(b[sortColumn]);
  //     };
  //   case 'boolean':
  //     return (a, b) => {
  //       return a[sortColumn] === b[sortColumn] ? 0 : a[sortColumn] ? 1 : -1;
  //     };
  //   case 'number':
  //     return (a, b) => {
  //       return a[sortColumn] - b[sortColumn];
  //     };
  //   default:
  //     throw new Error(`unsupported sortColumn: "${sortColumn}"`);
  // }
}

export const Table: FC<TableProps> = (props: TableProps) => {
  const { data } = props;
  const location = useLocation();
  const history = useHistory();
  const [sortColumns, setSortColumns] = useState<readonly Readonly<SortColumn>[]>([]);
  const [selectedRows, setSelectedRows] = useState<ReadonlySet<string>>(() => new Set());
  //TODO: use a hook for query management
  const query = new URLSearchParams(location.search);
  const queryState = queryToState(query);
  const scope = queryState.scope && queryState.scope[data.label];

  const sortedRows = useMemo((): readonly PlainObject[] => {
    if (sortColumns.length === 0 && !scope) return data.rows;

    const sortedRows = [
      ...data.rows.map((d) => ({
        ...d,
        //TODO: bettre in scope format ?
        inScope: scope && scope.includes(d.key) ? "in scope" : "",
      })),
    ];

    sortedRows.sort((a, b) => {
      for (const sort of sortColumns) {
        const comparator = getComparator(sort.columnKey);
        const compResult = comparator(a, b);
        if (compResult !== 0) {
          return sort.direction === "ASC" ? compResult : -compResult;
        }
      }
      return 0;
    });
    return sortedRows;
  }, [data, sortColumns, scope]);

  let autoColumns = [SelectColumn];
  // SCOPE management
  // the scope should maybe always be present
  if (scope) autoColumns.push({ key: "inScope", name: "Scope" });
  const setScope = new Set(scope);
  const selectedNotInScope = new Set<string>();
  const selectedInScope = new Set<string>();
  for (const id of selectedRows) {
    if (setScope.has(id)) selectedInScope.add(id);
    else selectedNotInScope.add(id);
  }

  return (
    <>
      <DataGrid
        rowKeyGetter={(r) => r.key}
        rows={sortedRows}
        columns={autoColumns.concat(data.columns.map((c) => ({ key: c.property, name: c.label })))}
        defaultColumnOptions={{
          sortable: true,
          resizable: true,
        }}
        selectedRows={selectedRows}
        onSelectedRowsChange={setSelectedRows}
        sortColumns={sortColumns}
        onSortColumnsChange={setSortColumns}
        className="data-grid"
      />
      <div className="data-grid-actions">
        <button
          className="btn btn-primary"
          disabled={selectedNotInScope.size === 0}
          onClick={() => {
            // ADD selected to scope
            history.push({
              search: stateToQueryString({
                ...queryState,
                scope: {
                  ...queryState.scope,
                  [data.label]: [...(scope || []), ...selectedNotInScope],
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
                ...queryState,
                scope: {
                  ...queryState.scope,
                  [data.label]: (scope || []).filter((id) => !selectedInScope.has(id)),
                },
              }),
            });
          }}
        >
          <GoDiffRemoved /> {selectedInScope.size} selected already in scope{" "}
        </button>
      </div>
    </>
  );
};
