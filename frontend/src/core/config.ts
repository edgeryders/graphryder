import { ConfigType } from "../types";

const config: ConfigType = {
  graphql: {
    http: "/graphql",
  },
  models: {
    code: {
      id: "code",
      color: "#0292D5",
      label: "code",
      icon: "code",
    },
    post: {
      id: "post",
      color: "#EA37B0",
      label: "post",
      icon: "file-alt",
    },
    user: {
      id: "user",
      color: "#6AD74D",
      label: "participant",
      icon: "user-alt",
    },
    annotation: {
      id: "annotation",
      color: "#555555",
      label: "annotation",
      icon: "pencil-alt",
    },
    topic: {
      id: "topic",
      color: "#555555",
      label: "topic",
      icon: "question",
    },
  },
};

export default config;
