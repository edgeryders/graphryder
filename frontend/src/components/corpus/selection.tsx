import React, { useState, useEffect } from "react";
import gql from "graphql-tag";
import { Link } from "react-router-dom";
import { client } from "../../core/client";
import { BoxWrapper } from "./../box-wrapper";

interface PlatformWithCorpus {
  name: string;
  url: string;
  corpus: Array<{ name: string }>;
}

const GRAPHQL_GET_CORPUS = gql`
  query {
    platform: platform {
      name
      url
      corpus {
        name
      }
    }
  }
`;

interface Props {
  platform?: string;
  corpora?: string;
}
export const CorpusSelection: React.FC<Props> = ({ platform, corpora }) => {
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dataset, setDataset] = useState<Array<PlatformWithCorpus>>([]);
  // Is the drop-down for platform is opened ?
  const [showPlatformDropDown, setShowPlatformDropDown] = useState<boolean>(false);
  const [showCorporaDropDown, setShowCorporaDropDown] = useState<boolean>(false);
  // The select items
  const [selectedPlatform, setPlatform] = useState<PlatformWithCorpus | null>(null);
  const [selectedCorpora, setCorpora] = useState<string | null>(null);

  useEffect(() => {
    // Load the data
    setIsLoading(true);
    client
      .query({
        query: GRAPHQL_GET_CORPUS,
        variables: {},
      })
      .then((result) => {
        setDataset(result.data.platform);
        if (platform) {
          const sPlatform = result.data.platform.find((i: PlatformWithCorpus) => i.name === platform);
          setPlatform(sPlatform);
          if (corpora && sPlatform && sPlatform.corpus.find((i: { name: string }) => i.name === corpora)) {
            setCorpora(corpora);
          }
        }
      })
      .catch((e) => {
        setError(e);
      })
      .finally(() => setIsLoading(false));

    const hideDropDown = () => {
      setShowPlatformDropDown(false);
      setShowCorporaDropDown(false);
    };
    document.addEventListener("click", hideDropDown);

    return () => {
      document.removeEventListener("click", hideDropDown);
    };
  }, [platform, corpora]);

  return (
    <div className="platform-corpus-selection p-3 shadow-sm mb-3">
      <div className="container-fluid">
        <div className="row">
          <div className="d-flex flex-column">
            <div>
              Choose a Edgeryders Communities platform and corpus to explore its posts, annotations and participants.
              <br />A corpus is a thematic collection of conversations (posts created by participants on topics) which
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
                            setCorpora(null);
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
            <span className="fw-bolder m-3">&nbsp;&nbsp;Corpus</span>
            <div className="dropdown">
              <button
                className="btn btn-secondary dropdown-toggle"
                onClick={(e) => {
                  setShowCorporaDropDown(!showCorporaDropDown);
                  e.stopPropagation();
                }}
                disabled={!selectedPlatform || selectedPlatform.corpus.length === 0}
              >
                {selectedCorpora ? selectedCorpora : "Select a corpus"}
              </button>
              {selectedPlatform && (
                <ul className={`dropdown-menu ${showCorporaDropDown ? "show" : ""}`}>
                  {selectedPlatform.corpus.map((item) => (
                    <li key={item.name}>
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          if (selectedCorpora !== item.name) {
                            setCorpora(item.name);
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
                className={`btn btn-primary ${!selectedCorpora ? "disabled" : ""}`}
                to={`/dashboard/${selectedPlatform?.name}/${selectedCorpora}`}
                title="Load data"
              >
                Load Corpus
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
