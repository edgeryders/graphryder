import { ConfigType } from "../types";

const config: ConfigType = {
  graphql: {
    http: "/graphql",
  },
  models: {
    code: {
      id: "code",
      name: "code",
      color: "#0292D5",
      icon: "code",
      label_field: "name",
      id_field: "discourse_id",
    },
    post: {
      id: "post",
      name: "post",
      color: "#EA37B0",
      icon: "file-alt",
      label_field: "topic_title",
      id_field: "discourse_id",
    },
    user: {
      id: "user",
      name: "participant",
      color: "#6AD74D",
      icon: "user-alt",
      label_field: "username",
      id_field: "discourse_id",
    },
    annotation: {
      id: "annotation",
      name: "annotation",
      color: "#555555",
      icon: "pencil-alt",
      label_field: "discourse_id",
      id_field: "discourse_id",
    },
    topic: {
      id: "topic",
      name: "topic",
      color: "#555555",
      icon: "question",
      label_field: "title",
      id_field: "discourse_id",
    },
  },
};

export default config;
