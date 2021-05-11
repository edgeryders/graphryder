import { CameraState, MouseCoords } from "sigma/types";
import { NodeKey } from "graphology-types";
import { useSigma, useRegisterEvents, useLoadGraph, useSetSettings } from "./hooks";
import { SigmaContainer } from "./SigmaContainer";
import { ControlsContainer } from "./controls/ControlsContainer";
import { ForceAtlasControl } from "./controls/ForceAtlasControl";
import { ZoomControl } from "./controls/ZoomControl";
import { FullScreenControl } from "./controls/FullScreenControl";

export interface EventHandlers {
  clickNode: (e: { node: NodeKey; event: MouseCoords }) => void;
  rightClickNode: (e: { node: NodeKey; event: MouseCoords }) => void;
  downNode: (e: { node: NodeKey; event: MouseCoords }) => void;
  leaveNode: (e: { node: NodeKey }) => void;
  enterNode: (e: { node: NodeKey }) => void;
  clickStage: (e: { event: MouseCoords }) => void;
  rightClickStage: (e: { event: MouseCoords }) => void;
  downStage: (e: { event: MouseCoords }) => void;
  kill: () => void;
  cameraUpdated: (e: CameraState) => void;
}

export {
  ControlsContainer,
  ForceAtlasControl,
  FullScreenControl,
  SigmaContainer,
  ZoomControl,
  useSigma,
  useRegisterEvents,
  useLoadGraph,
  useSetSettings,
};
