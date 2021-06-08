import React, { FC, useMemo, useState } from "react";
import DataGrid, { SortColumn, SelectColumn } from "react-data-grid";
import { useHistory, useLocation } from "react-router";
import { PlainObject } from "sigma/types";

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

  const sortedRows = useMemo((): readonly PlainObject[] => {
    if (sortColumns.length === 0) return data.rows;

    const sortedRows = [...data.rows];
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
  }, [data, sortColumns]);

  return (
    <>
      <DataGrid
        rowKeyGetter={(r) => r.key}
        rows={sortedRows}
        columns={[SelectColumn].concat(data.columns.map((c) => ({ key: c.property, name: c.label })))}
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
        {selectedRows.size} selected{" "}
        <button
          className="btn"
          onClick={() => {
            const ids: string[] = [];
            selectedRows.forEach((id) => {
              ids.push(id);
            });
            history.push({
              search: stateToQueryString({
                ...queryState,
                scope: {
                  ...queryState.scope,
                  [data.label]: ids,
                },
              }),
            });
          }}
        >
          apply to scope
        </button>
      </div>
    </>
  );
};
