import { useEffect, useState } from "react";
import { Sigma } from "sigma";
import { Settings } from "sigma/settings";
import Graph from "graphology";
import { useSigmaContext } from "./context";
import { EventHandlers } from "./index";

export function useSigma(): Sigma {
  return useSigmaContext().sigma;
}

export function useLoadGraph(): (graph: Graph, clear?: boolean) => void {
  const sigma = useSigma();

  return (graph: Graph, clear = true) => {
    if (sigma && graph) {
      if (clear && sigma.getGraph().order > 0) sigma.getGraph().clear();
      sigma.getGraph().import(graph);
    }
  };
}

export function useRegisterEvents(): (eventHandlers: Partial<EventHandlers>) => void {
  const sigma = useSigma();
  const [eventHandlers, setEventHandlers] = useState<Partial<EventHandlers>>({});

  useEffect(() => {
    let event: keyof typeof eventHandlers;
    if (sigma && eventHandlers) {
      for (event in eventHandlers) {
        const eventHandler = eventHandlers[event] as (...args: any[]) => void;
        if (event === "cameraUpdated") {
          sigma.getCamera().on(event, eventHandler);
        } else {
          sigma.on(event, eventHandler);
        }
      }
      // cleanup
      return () => {
        if (sigma) {
          let event: keyof typeof eventHandlers;
          for (event in eventHandlers) {
            const eventHandler = eventHandlers[event] as (...args: any[]) => void;
            if (event === "cameraUpdated") {
              sigma.getCamera().removeListener(event, eventHandler);
            } else {
              sigma.removeListener(event, eventHandler);
            }
          }
        }
      };
    }
  }, [sigma, eventHandlers]);

  return setEventHandlers;
}

export function useSetSettings(): (newSettings: Partial<Settings>) => void {
  const sigma = useSigma();
  const [settings, setSettings] = useState<Partial<Settings>>({});

  useEffect(() => {
    if (sigma && settings) {
      const prevSettings: Partial<Settings> = {};

      Object.keys(settings).forEach((name: string) => {
        const key = name as keyof Settings;
        prevSettings[key] = sigma.getSetting(key) as any;
        sigma.setSetting(key, settings[key] as any);
      });

      // // cleanup
      // return () => {
      //   if (sigma) {
      //     Object.keys(prevSettings).forEach((name) => {
      //       const key = name as keyof Settings;
      //       console.log("cleanup", key, prevSettings[key]);
      //       sigma.setSetting(key, prevSettings[key] as any);
      //     });
      //   }
      // };
    }
  }, [sigma, settings]);

  return setSettings;
}
