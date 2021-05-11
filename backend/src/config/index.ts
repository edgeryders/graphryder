type LogLevel = "error" | "warning" | "info" | "debug" | "off";

interface ConfigLog {
  console_level: LogLevel;
  file_level: LogLevel;
  file_maxsize: string;
  file_retention: string;
  file_path: string;
}

interface ConfigNeo4j {
  url: string;
  login: string;
  password: string;
  options?: { [key: string]: string | boolean | number };
}

export interface GraphStyle {
  [label: string]: {
    color: string;
    label_field: string;
  };
}

export interface Config {
  port: number;
  error_with_stack: boolean;
  logs: ConfigLog;
  neo4j: ConfigNeo4j;
  graph_style: GraphStyle;
}

export const config: Config = {
  port: process.env.BACKEND_PORT ? Number(process.env.BACKEND_PORT) : 4000,
  error_with_stack: process.env.ERROR_WITH_STACK ? true : false,
  logs: {
    console_level: (process.env.LOG_CONSOLE_LEVEL || "info") as LogLevel,
    file_level: (process.env.LOG_FILE_LEVEL || "error") as LogLevel,
    file_maxsize: "200m",
    file_retention: "7d",
    file_path: "./",
  },
  neo4j: {
    url: process.env.NEO4J_URL || "bolt://localhost:7687",
    login: process.env.NEO4J_LOGIN || "neo4j",
    password: process.env.NEO4J_PASSWORD || "admin",
    options: { disableLosslessIntegers: true },
  },
  graph_style: {
    code: {
      color: "#C90303",
      label_field: "name",
    },
    user: {
      color: "#00CA00",
      label_field: "username",
    },
    post: {
      color: "#423204",
      label_field: "topic_title",
    },
    topic: {
      color: "#F98E24",
      label_field: "title",
    },
    annotation: {
      color: "#23b3d7",
      label_field: "text",
    },
  },
};
