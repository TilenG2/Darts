#version 300 es
precision mediump float;
precision mediump sampler2D;

uniform sampler2D uBaseTexture;
uniform vec4 uBaseFactor;
uniform vec3 uLightPosition;

in vec2 vTexCoord;
in vec3 vNormal;
in vec3 vPosition;

out vec4 oColor;

void main() {
    vec3 L = normalize(uLightPosition - vPosition);
    vec3 N = normalize(vNormal);
    float lambert = max(dot(N, L), 0.0f);
    float ambient = 0.4f;

    vec4 baseColor = texture(uBaseTexture, vTexCoord);
    oColor = uBaseFactor * baseColor * vec4(vec3(lambert + ambient), 1);
}
