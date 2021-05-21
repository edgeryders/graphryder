export type ModelTypes = "user" | "code" | "post" | "annotation" | "topic";

export type ModelType = {
  id: ModelTypes;
  label: string;
  color: string;
  icon: string;
};

export type ConfigType = {
  graphql: { http: string };
  models: { [key: string]: ModelType };
};
