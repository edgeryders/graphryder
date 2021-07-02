import { NodeDisplayData, PartialButFor } from "sigma/types";

const PI_TIMES_2 = Math.PI * 2;

/**
 * Function used by the canvas renderer to display a single node.
 */
export default function drawNodeWithCircles(
  context: CanvasRenderingContext2D,
  data: PartialButFor<NodeDisplayData, "x" | "y" | "size" | "color">,
): void {
  context.fillStyle = data.color;
  context.beginPath();
  context.arc(data.x, data.y, data.size, 0, PI_TIMES_2, true);

  context.closePath();
  context.fill();

  context.fillStyle = data.insideColor || data.color;
  context.beginPath();
  context.arc(data.x, data.y, data.size * 0.7, 0, PI_TIMES_2, true);

  context.closePath();
  context.fill();

  context.fillStyle = data.dotColor || data.insideColor || data.color;
  context.beginPath();
  context.arc(data.x, data.y, data.size * 0.3, 0, PI_TIMES_2, true);

  context.closePath();
  context.fill();
}
