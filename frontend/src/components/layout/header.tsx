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
      <nav className="navbar navbar-dark head">
        <div id="brand">
          <Link id="go-home" to={"/"} title="go back to home page">
            <b>RyderEx</b>
          </Link>{" "}
          &gt; {platform} &gt; {corpus}
        </div>
      </nav>
    </header>
  );
};
