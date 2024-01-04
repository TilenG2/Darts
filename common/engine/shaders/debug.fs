#version 300 es
precision mediump float;
precision mediump sampler2D;

uniform sampler2D uTexture;

in vec2 vTexCoord;

out vec4 oColor;

void main() {
    oColor = texture(uTexture, vTexCoord);
}