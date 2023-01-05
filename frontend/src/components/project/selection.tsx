import React, { useState, useEffect } from "react";
import gql from "graphql-tag";
import { Link } from "react-router-dom";
import { client } from "../../core/client";

interface PlatformWithProject {
  name: string;
  url: string;
  projects: Array<{ name: string }>;
}

const GRAPHQL_GET_PROJECT = gql`
  query {
    platform: platform {
      name
      url
      projects {
        name
      }
    }
  }
`;

interface Props {
  platform?: string;
  project?: string;
}
export const ProjectSelection: React.FC<Props> = ({ platform, project }) => {
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dataset, setDataset] = useState<Array<PlatformWithProject>>([]);
  // Is the drop-down for platform is opened ?
  const [showPlatformDropDown, setShowPlatformDropDown] = useState<boolean>(false);
  const [showProjectDropDown, setShowProjectDropDown] = useState<boolean>(false);
  // The select items
  const [selectedPlatform, setPlatform] = useState<PlatformWithProject | null>(null);
  const [selectedProject, setProject] = useState<string | null>(null);

  useEffect(() => {
    // Load the data
    setIsLoading(true);
    client
      .query({
        query: GRAPHQL_GET_PROJECT,
        variables: {},
      })
      .then((result) => {
        setDataset(result.data.platform);
        if (platform) {
          const sPlatform = result.data.platform.find((i: PlatformWithProject) => i.name === platform);
          setPlatform(sPlatform);
          if (project && sPlatform && sPlatform.projects.find((i: { name: string }) => i.name === project)) {
            setProject(project);
          }
        }
      })
      .catch((e) => {
        setError(e);
      })
      .finally(() => setIsLoading(false));

    const hideDropDown = () => {
      setShowPlatformDropDown(false);
      setShowProjectDropDown(false);
    };
    document.addEventListener("click", hideDropDown);

    return () => {
      document.removeEventListener("click", hideDropDown);
    };
  }, [platform, project]);

  return (
    <div className="platform-project-selection p-3 shadow-sm mb-3">
      <div className="container-fluid">
        <div className="row">
          <div className="d-flex flex-column">
            <div>
              Choose a Edgeryders Communities platform and project to explore its posts, annotations and participants.
              <br />A project is a thematic collection of conversations (posts created by participants on topics) which
              has been annotated with qualitative codes.
            </div>
            <div className="d-flex align-items-center mt-2">
              <span className="fw-bolder m-3">Platform</span>
              <div className="dropdown">
                <button
                  className="btn btn-secondary dropdown-toggle"
                  onClick={(e) => {
                    setShowPlatformDropDown(!showPlatformDropDown);
                    e.stopPropagation();
                  }}
                >
                  {selectedPlatform ? selectedPlatform.name : "Select a platform"}
                </button>
                <ul className={`dropdown-menu ${showPlatformDropDown ? "show" : ""}`}>
                  {dataset.map((item) => (
                    <li key={item.name}>
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          if (selectedPlatform !== item) {
                            setPlatform(item);
                            setProject(null);
                          }
                        }}
                      >
                        {item.name} - {item.url}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center">
            <span className="fw-bolder m-3">&nbsp;&nbsp;Project</span>
            <div className="dropdown">
              <button
                className="btn btn-secondary dropdown-toggle"
                onClick={(e) => {
                  setShowProjectDropDown(!showProjectDropDown);
                  e.stopPropagation();
                }}
                disabled={!selectedPlatform || selectedPlatform.projects.length === 0}
              >
                {selectedProject ? selectedProject : "Select a project"}
              </button>
              {selectedPlatform && (
                <ul className={`dropdown-menu ${showProjectDropDown ? "show" : ""}`}>
                  {selectedPlatform.projects.map((item) => (
                    <li key={item.name}>
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          if (selectedProject !== item.name) {
                            setProject(item.name);
                          }
                        }}
                      >
                        {item.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="ms-5">
              <Link
                className={`btn btn-primary ${!selectedProject ? "disabled" : ""}`}
                to={`/dashboard/${selectedPlatform?.name}/${selectedProject}`}
                title="Load data"
              >
                Load Project
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
