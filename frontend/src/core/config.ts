import { PlainObject } from "sigma/types";
import { ConfigType } from "../types";

const generic_uniq_id = (node: { labels: string[]; properties: PlainObject }) =>
  `${node.properties.platform}_${node.labels.join("|")}_${node.properties.discourse_id}`;

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
      uniq_id: generic_uniq_id,
    },
    post: {
      id: "post",
      name: "post",
      color: "#EA37B0",
      icon: "file-alt",
      label_field: "topic_title",
      uniq_id: generic_uniq_id,
    },
    user: {
      id: "user",
      name: "participant",
      color: "#6AD74D",
      icon: "user-alt",
      label_field: "username",
      uniq_id: generic_uniq_id,
    },
    annotation: {
      id: "annotation",
      name: "annotation",
      color: "#555555",
      icon: "pencil-alt",
      label_field: "discourse_id",
      uniq_id: generic_uniq_id,
    },
    topic: {
      id: "topic",
      name: "topic",
      color: "#555555",
      icon: "question",
      label_field: "title",
      uniq_id: generic_uniq_id,
    },
  },
};

export default config;
