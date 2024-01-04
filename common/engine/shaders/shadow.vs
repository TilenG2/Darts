#version 300 es
#define LIGHT_COUNT 6

uniform mat4[LIGHT_COUNT] uLightMatrix;
uniform mat4 uModelMatrix;

layout (location = 0) in vec4 aPosition;

void main() {
    mat4 lightMatrix = mat4(0);
    for (int i = 0; i < LIGHT_COUNT; i++) {
        lightMatrix += uLightMatrix[i];
    }

    gl_Position = lightMatrix * uModelMatrix * aPosition;
}