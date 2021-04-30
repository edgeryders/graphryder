import React, { FC } from "react";

import { TableDataType } from "../../core/data";

export interface TableProps {
  data: TableDataType
}

export const Table: FC<TableProps> = () => {
  return <div>[table component]</div>;
};
