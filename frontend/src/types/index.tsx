import { PlainObject } from "sigma/types";

export type ModelTypes = "user" | "code" | "post" | "annotation" | "topic";

export type TableColumn = {
  property: string;
  label: string;
  type?: "string" | "boolean" | "number" | "date" | "url";
};

export type ModelType = {
  id: ModelTypes;
  name: string;
  color: string;
  icon: string;
  label_field: string;
  uniq_id: (node: { labels: string[]; properties: PlainObject }) => string;
  tableColumns: TableColumn[];
};

export type ConfigType = {
  graphql: { http: string };
  models: { [key: string]: ModelType };
};
