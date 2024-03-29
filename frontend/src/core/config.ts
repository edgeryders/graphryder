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
              if (atts["@type"] === "IN_PROJECT") {
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
        { 
          property: "topic_link", 
          label: "Topic",
          type: "url",
          generateFromNode: (graph, node): string[] => {
            let url = graph.getNodeAttribute(node, "post_url");
            let title = graph.getNodeAttribute(node, "topic_title")
            let link = [url, title]
            return link;
          }
        },
        { property: "created_at", label: "Created at", type: "date" },
        { property: "word_count", label: "Word count", type: "number" },
        { property: "username", label: "Author" },
        {
          property: "codes_in_scope",
          label: "Codes in scope",
          type: "number",
          generateFromNode: (graph, node): number => {
            let nb_code_in_scope = 0;
            let codes: string[] = [];
            // reach annotations nodes
            graph.forEachInEdge(node, (_, atts, annotation, target) => {
              if (atts["@type"] === "ANNOTATES") {
                // reach code nodes
                graph.forEachOutEdge(annotation, (__, atts, _source, code, _src_atts, code_atts) => {
                  // check if code is in_scope and only count each code once
                  if (code_atts.inScope && !codes.includes(code_atts.discourse_id)) nb_code_in_scope += 1;
                  if (code_atts.inScope) codes.push(code_atts.discourse_id);
                });
              }
            });
            return nb_code_in_scope;
          },
        },
      ],
    },
    user: {
      id: "user",
      name: "participant",
      color: "#6AD74D",
      icon: "user-alt",
      label_field: "username",
      tableColumns: [
        { 
          property: "user", 
          label: "Name",
          type: "url",
          generateFromNode: (graph, node): string[] => {
            let url = graph.getNodeAttribute(node, "profile");
            let title = graph.getNodeAttribute(node, "username")
            let link = [url, title]
            return link;
          }  
        }
      ],
    },
    annotation: {
      id: "annotation",
      name: "annotation",
      color: "#555555",
      icon: "pencil-alt",
      label_field: "discourse_id",
      tableColumns: [
        { 
          property: "quote_link", 
          label: "Quote",
          type: "url",
          generateFromNode: (graph, node): string[] => {
            let post_url = "";
            graph.forEachOutEdge(node, (_, atts, annotation, post, annotations_atts, post_atts) => {
              if (atts["@type"] === "ANNOTATES") { 
                post_url = post_atts.post_url
              }
            });
            let quote = "[Multimedia annotation]"
            if (graph.getNodeAttribute(node, "type") === "AnnotatorStore::TextAnnotation") quote = graph.getNodeAttribute(node, "quote")
            return [post_url, quote]
          }
        },
        { property: "created_at", label: "Created at", type: "date" },
        { 
          property: "code", 
          label: "Code",
          type: "string",
          generateFromNode: (graph, node): string => {
            let code_name = '';
            graph.forEachOutEdge(node, (_, atts, annotation, code, annotations_atts, code_atts) => {
              if (atts["@type"] === "REFERS_TO") { 
                code_name = code_atts.name
              }
            });
            return code_name;
          }
        },
        {
          property: "scope",
          label: "In scope",
          type: "string",
          generateFromNode: (graph, node): string => {
            let code_in_scope = '';
            graph.forEachOutEdge(node, (_, atts, annotation, code, annotations_atts, code_atts) => {
              if (atts["@type"] === "REFERS_TO") { 
                if (code_atts.inScope) code_in_scope = "✓"
              }
            });
            return code_in_scope;
          }
        },
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
