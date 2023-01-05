import React from "react";
import { Link } from "react-router-dom";

interface Props {
  platform?: string;
  project?: string;
}

export const Header: React.FC<Props> = (props: Props) => {
  const { platform, project } = props;
  return (
    <header className="sticky-top">
      <nav className="navbar navbar-dark head">
        <div id="brand">
          <Link id="go-home" to={"/"} title="go back to home page">
            <b>Graphryder</b>
          </Link>{" "}
          &gt; {platform} &gt; {project}
        </div>
      </nav>
    </header>
  );
};
