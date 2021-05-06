import { useSigma, useRegisterEvents, useLoadGraph, useSetSettings } from "./hooks";
import { ForceAtlasControl } from "./ForceAtlasControl";
import { SigmaContainer } from "./SigmaContainer";
import { ZoomControl } from "./ZoomControl";
import { ControlsContainer } from "./ControlsContainer";

export interface EventHandlers {
  clickNode: (e: any) => void;
  rightClickNode: (e: any) => void;
  downNode: (e: any) => void;
  leaveNode: (e: any) => void;
  enterNode: (e: any) => void;
  clickStage: (e: any) => void;
  rightClickStage: (e: any) => void;
  downStage: (e: any) => void;
  kill: () => void;
  cameraUpdated: (e: any) => void;
}

export {
  ControlsContainer,
  ForceAtlasControl,
  SigmaContainer,
  ZoomControl,
  useSigma,
  useRegisterEvents,
  useLoadGraph,
  useSetSettings,
};
