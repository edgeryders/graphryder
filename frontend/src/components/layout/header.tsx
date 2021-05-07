import React from "react";
import { Link } from "react-router-dom";

export const Header: React.FC = () => {
  return (
    <header className="sticky-top">
      <nav className="navbar navbar-dark bg-primary navbar-expand-lg">
        <div id="brand">
          <Link className="navbar-brand" to={"/"} title="Ryderex">
            <img src="/logo192.png" alt="Logo" width="40" />
            Ryderex
          </Link>
        </div>
      </nav>
    </header>
  );
};
