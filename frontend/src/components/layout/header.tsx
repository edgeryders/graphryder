import React from "react";
import { Link } from "react-router-dom";

interface Props {
  platform?: string;
  corpus?: string;
}

export const Header: React.FC<Props> = (props: Props) => {
  const { platform, corpus } = props;
  return (
    <header className="sticky-top">
      <nav className="navbar navbar-dark navbar-expand-lg">
        <div id="brand">
          <Link className="navbar-brand" to={"/"} title="Ryderex">
            Ryderex &gt; {platform} &gt; {corpus}
          </Link>
        </div>
      </nav>
    </header>
  );
};
