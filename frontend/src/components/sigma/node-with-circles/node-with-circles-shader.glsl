precision mediump float;

varying vec4 v_color;
varying vec4 v_insideColor;
varying vec4 v_dotColor;
varying float v_border;

const float radius = 0.2;
const float halfRadius = 0.1;
const float dotRadius = 0.05;

void main(void) {
  vec4 transparent = vec4(0.0, 0.0, 0.0, 0.0);
  float distToCenter = length(gl_PointCoord - vec2(0.5, 0.5));

  // Inner dot
  if (distToCenter < dotRadius - v_border) {
    gl_FragColor = v_dotColor;
  }
  // Antialiasing between the dot and the inner disc
  else if (distToCenter < dotRadius) {
    gl_FragColor = mix(v_insideColor, v_dotColor, (dotRadius - distToCenter) / v_border);
  }
  // Outer disc
  else // Inner disc
  if (distToCenter < halfRadius - v_border) {
    gl_FragColor = v_insideColor;
  }
  // Antialiasing between the two disc
  else if (distToCenter < halfRadius) {
    gl_FragColor = mix(v_color, v_insideColor, (halfRadius - distToCenter) / v_border);
  }
  // Outer disc
  else if (distToCenter < radius - v_border) {
    gl_FragColor = v_color;
  }
  // Antialiasing between outer disc and the outside
  else if (distToCenter < radius) {
    gl_FragColor = mix(transparent, v_color, (radius - distToCenter) / v_border);
  }
  // Outside the node
  else {
    gl_FragColor = transparent;
  }
}
