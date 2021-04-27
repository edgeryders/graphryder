import React from "react";
import ReactDOM from "react-dom";
import "./scss/index.scss";
import reportWebVitals from "./reportWebVitals";
// Routing system
import { BrowserRouter as Router } from "react-router-dom";
import { Layout } from "./layout";
import { RouterWrapper } from "./router/router";
import { routes } from "./router/routes";

ReactDOM.render(
  <React.StrictMode>
    <div id="app-wrapper">
      <Router>
        <RouterWrapper routes={routes} wrapper={Layout} />
      </Router>
    </div>
  </React.StrictMode>,
  document.getElementById("root"),
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
