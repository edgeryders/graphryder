import { ConfigType } from "../types";

const config: ConfigType = {
  networkStyle: {
    scopeColor: "#f15c33",
    selectColor: "#FFFFFF",
  },
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
      tableColumns: [
        { property: "name", label: "Name" },
        { property: "description", label: "Description" },
        { property: "created_at", label: "Created at", type: "date" },
        {
          property: "annotation_count",
          label: "Annotation count",
          type: "number",
          generateFromNode: (graph, node): number => {
            let nb_annotation = 0;
            graph.forEachOutEdgeUntil(node, (e, atts, source, target) => {
              if (atts["@type"] === "IN_CORPUS") {
                nb_annotation = atts.annotation_count;
                return true;
              }
              return false;
            });
            return nb_annotation;
          },
        },
      ],
    },
    post: {
      id: "post",
      name: "post",
      color: "#EA37B0",
      icon: "file-alt",
      label_field: "topic_title",
      tableColumns: [
        { property: "raw", label: "Content" },
        { property: "postUrl", label: "Post url", type: "url" },
        { property: "topic_title", label: "Topic" },
        { property: "topicUrl", label: "Topic url", type: "url" },
        { property: "created_at", label: "Created at", type: "date" },
        { property: "word_count", label: "Word count", type: "number" },
        { property: "username", label: "Author" },
      ],
    },
    user: {
      id: "user",
      name: "participant",
      color: "#6AD74D",
      icon: "user-alt",
      label_field: "username",
      tableColumns: [
        { property: "username", label: "Name" },
        { property: "profileUrl", label: "Profile url", type: "url" },
      ],
    },
    annotation: {
      id: "annotation",
      name: "annotation",
      color: "#555555",
      icon: "pencil-alt",
      label_field: "discourse_id",
      tableColumns: [
        { property: "quote", label: "Quote" },
        { property: "created_at", label: "Created at", type: "date" },
        { property: "username", label: "Anotator" },
      ],
    },
    topic: {
      id: "topic",
      name: "topic",
      color: "#555555",
      icon: "question",
      label_field: "title",
      tableColumns: [],
    },
  },
};

export default config;
