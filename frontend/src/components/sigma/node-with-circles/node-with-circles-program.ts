/**
 * This program is a copy of src/renderers/webgl/program/node.fast.js, but with
 * a custom fragment shader (./custom-node-fragment-shader.glsl) that will draw
 * a disc inside the nodes.
 */
import { AbstractNodeProgram, RenderNodeParams } from "sigma/rendering/webgl/programs/common/node";
import { NodeDisplayData } from "sigma/types";
import { floatColor } from "sigma/utils";
// eslint-disable-next-line import/no-webpack-loader-syntax
import raw from "raw.macro";
const vertexShaderSource = raw("./node-with-circles.vertex.glsl");
// eslint-disable-next-line import/no-webpack-loader-syntax
const fragmentShaderSource = raw("./node-with-circles-shader.glsl");

const POINTS = 3,
  ATTRIBUTES = 6;

export default class NodeWithCirclesProgram extends AbstractNodeProgram {
  // specific attribute
  insideColorLocation: number;
  dotColorLocation: number;

  constructor(gl: WebGLRenderingContext) {
    super(gl, vertexShaderSource, fragmentShaderSource, POINTS, ATTRIBUTES);
    this.bind();
    // Locations
    this.insideColorLocation = gl.getAttribLocation(this.program, "a_insideColor");
    this.dotColorLocation = gl.getAttribLocation(this.program, "a_dotColor");

    // Bindings
    gl.enableVertexAttribArray(this.insideColorLocation);
    gl.enableVertexAttribArray(this.dotColorLocation);

    gl.vertexAttribPointer(
      this.insideColorLocation,
      4,
      gl.UNSIGNED_BYTE,
      true,
      ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT,
      16,
    );
    gl.vertexAttribPointer(
      this.dotColorLocation,
      4,
      gl.UNSIGNED_BYTE,
      true,
      ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT,
      20,
    );
  }

  process(data: NodeDisplayData & { insideColor: string; dotColor: string }, hidden: boolean, offset: number): void {
    let i = offset * POINTS * ATTRIBUTES;
    const array = this.array;

    if (hidden) {
      array[i++] = 0;
      array[i++] = 0;
      array[i++] = 0;
      array[i++] = 0;
      array[i++] = 0;
      array[i++] = 0;
      return;
    }

    const color = floatColor(data.color);
    const insideColor = floatColor(data.insideColor || data.color);
    const dotColor = floatColor(data.dotColor || data.insideColor || data.color);

    array[i++] = data.x;
    array[i++] = data.y;
    array[i++] = data.size;
    array[i++] = color;
    array[i++] = insideColor;
    array[i++] = dotColor;
  }

  render(params: RenderNodeParams): void {
    const gl = this.gl;

    const program = this.program;
    gl.useProgram(program);

    gl.uniform1f(this.ratioLocation, 1 / Math.pow(params.ratio, params.nodesPowRatio));
    gl.uniform1f(this.scaleLocation, params.scalingRatio);
    gl.uniformMatrix3fv(this.matrixLocation, false, params.matrix);

    gl.drawArrays(gl.POINTS, 0, this.array.length / ATTRIBUTES);
  }
}
