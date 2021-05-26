export type ModelTypes = "user" | "code" | "post" | "annotation" | "topic";

export type ModelType = {
  id: ModelTypes;
  name: string;
  color: string;
  icon: string;
  label_field: string;
  id_field: string;
};

export type ConfigType = {
  graphql: { http: string };
  models: { [key: string]: ModelType };
};
