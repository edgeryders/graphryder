import React, { CSSProperties, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Sigma } from "sigma";
import Graph from "graphology";
import { GraphOptions } from "graphology-types";
import { SigmaProvider } from "./context";

interface SigmaContainerProps {
  graphOptions?: GraphOptions;
  initialSettings?: any;
  id?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export const SigmaContainer: React.FC<SigmaContainerProps> = ({
  graphOptions,
  id,
  className,
  style,
  initialSettings,
  children,
}) => {
  // HTML element for the sigma instance
  const containerRef = useRef<HTMLDivElement>(null);
  // Common html props for the container
  const [props] = useState({ className: `react-sigma-v2 ${className ? className : ""}`, id, style });
  // The sigma instance
  const [sigma, setSigma] = useState<Sigma | null>(null);

  const context = useMemo(() => (sigma ? { sigma } : null), [sigma]);
  const contents = context !== null ? <SigmaProvider value={context}>{children}</SigmaProvider> : null;

  // When graphOptions or settings changed
  useEffect(() => {
    if (containerRef.current !== null) {
      const instance = new Sigma(new Graph(graphOptions), containerRef.current, initialSettings);
      setSigma(instance);
    }
    return () => {
      setSigma((instance) => {
        if (instance) instance.kill();
        return null;
      });
    };
  }, [containerRef, graphOptions, initialSettings]);

  return (
    <div {...props}>
      <div className={"sigma-container"} ref={containerRef}></div>
      {contents}
    </div>
  );
};
