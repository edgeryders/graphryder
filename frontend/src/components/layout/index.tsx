import React from "react";

import { Header } from "./header";
import { Footer } from "./footer";

export const Layout: React.FC<{}> = ({ children }) => {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
};
