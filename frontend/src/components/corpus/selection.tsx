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
  const [showDropDown, setShowDropDown] = useState<boolean>(false);
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

    const hideDropDown = () => setShowDropDown(false);
    document.addEventListener("click", hideDropDown);

    return () => {
      document.removeEventListener("click", hideDropDown);
    };
  }, [platform, corpora]);

  return (
    <BoxWrapper>
      <div className="container-fluid">
        <div className="row">
          <div className="col-6">
            {selectedPlatform && (
              <>
                <h4>Platform: {selectedPlatform.url}</h4>
                <p>
                  You are viewing posts, annotations and users from this plateform. You can select others platforms in
                  the Edgeryders Communities
                </p>
              </>
            )}

            <h4>Select new data</h4>
            <div className="bg-light bg-gradient d-flex align-items-center justify-content-center p-2 w-75 mx-auto">
              <span className="fw-bolder m-3">Plateform</span>
              <div className="dropdown">
                <button
                  className="btn btn-secondary dropdown-toggle"
                  onClick={(e) => {
                    setShowDropDown(!showDropDown);
                    e.stopPropagation();
                  }}
                >
                  {selectedPlatform ? selectedPlatform.name : "Select a platform"}
                </button>
                <ul className={`dropdown-menu ${showDropDown ? "show" : ""}`}>
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
                        {item.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {selectedPlatform && (
            <div className="col-6">
              <h4>Corpora {selectedCorpora ? `: ${selectedCorpora}` : ""}</h4>
              <p>
                You are viewing posts in these "corpora". A corpus is a collection of annotated pots that belongs to a
                particular set of conversations on the platform.
              </p>
              <fieldset>
                <legend>Corpora</legend>
                {selectedPlatform.corpus.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    className={`m-1 btn ${selectedCorpora === item.name ? "btn-secondary" : "btn-light"}`}
                    onClick={() => setCorpora(item.name)}
                  >
                    {item.name}
                  </button>
                ))}
              </fieldset>
            </div>
          )}
        </div>

        <div className="row mt-3">
          <div className="col-12 d-flex justify-content-end">
            <Link
              className={`btn btn-primary ${!selectedCorpora ? "disabled" : ""}`}
              to={`/dashboard/${selectedPlatform?.name}/${selectedCorpora}`}
              title="Load data"
            >
              Load data
            </Link>
          </div>
        </div>
      </div>
    </BoxWrapper>
  );
};
