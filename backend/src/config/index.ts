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

export interface Config {
  port: number;
  error_with_stack: boolean;
  logs: ConfigLog;
  neo4j: ConfigNeo4j;
}

export const config: Config = {
  port: 4000,
  error_with_stack: true,
  logs: {
    console_level: "info",
    file_level: "error",
    file_maxsize: "250m",
    file_retention: "1",
    file_path: "./",
  },
  neo4j: {
    url: process.env.NEO4J_URL || "bolt://localhost:7687",
    login: process.env.NEO4J_LOGIN || "neo4j",
    password: process.env.NEO4J_PASSWORD || "admin",
  },
};
