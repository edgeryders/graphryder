import { FC, useMemo, useState } from "react";
import DataGrid, { SortColumn, SelectColumn, Column } from "react-data-grid";

import { PlainObject } from "sigma/types";

import { TableDataType } from "../../core/data";
import { QueryState } from "../../core/queryState";
import { ScopeActions } from "./scope-actions";

export interface TableProps {
  moduleID: string;
  data: TableDataType;
  state: QueryState;
  noScope?: boolean;
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
  const { data, state, noScope } = props;

  const [sortColumns, setSortColumns] = useState<readonly Readonly<SortColumn>[]>([]);
  const [selectedRows, setSelectedRows] = useState<ReadonlySet<string>>(() => new Set());

  const scope = state.scope && state.scope[data.label];

  const sortedRows = useMemo((): readonly PlainObject[] => {
    if (sortColumns.length === 0 && !scope) return data.rows;

    const sortedRows = [
      ...data.rows.map((d) => ({
        ...d,
        //TODO: bettre in scope format ?
        inScope: !noScope && scope && scope.includes(d.key) ? "in scope" : "",
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
  if (!noScope) autoColumns.push({ key: "inScope", name: "Scope" });

  return (
    <>
      <DataGrid
        rowKeyGetter={(r) => r.key}
        rows={sortedRows}
        columns={autoColumns.concat(
          data.columns.map((c) => {
            const dataGridColumn: Column<PlainObject> = { key: c.property, name: c.label };
            switch (c.type) {
              case "url":
              dataGridColumn.formatter = ({ row, column }) => (
                  <>{row[column.key][0] && <a target='_blank' href={row[column.key][0]}>{row[column.key][1]}</a>}</>
                );
                break;
              case "date":
                dataGridColumn.formatter = ({ row, column }) => (
                  <>
                    {row[column.key]
                      ? new Intl.DateTimeFormat(navigator.language, { dateStyle: "short", timeStyle: "short" }).format(
                          new Date(row[column.key]),
                        )
                      : ""}
                  </>
                );
                break;
            }
            return dataGridColumn;
          }),
        )}
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
      {!noScope && (
        <div className="data-grid-footer">
          <ScopeActions model={data.label} selectedIds={selectedRows} state={state} />
        </div>
      )}
    </>
  );
};

export const TableWithoutScope: FC<TableProps> = (props: TableProps) => {
  return <Table {...{ ...props, noScope: true }} />;
};
