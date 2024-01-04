#version 300 es

layout (location = 0) in vec2 aPosition;

out vec2 vTexCoord;

void main() {
    vTexCoord = aPosition * 0.5f + 0.5f;
    gl_Position = vec4(aPosition, 0, 1);
}