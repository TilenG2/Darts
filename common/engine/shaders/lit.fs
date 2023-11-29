#version 300 es
precision mediump float;
precision mediump sampler2D;

#define LIGHT_COUNT 6

uniform sampler2D uBaseTexture;
uniform vec4 uBaseFactor;

struct Light {
    vec3 position;
    float intensity;
    vec3 color;
};

uniform Light[LIGHT_COUNT] uLights;

in vec2 vTexCoord;
in vec3 vNormal;
in vec3 vPosition;

out vec4 oColor;

float lightCurve = 6.0f;

vec3 getIlumination(Light light, vec3 N) {
    vec3 lightVector = light.position - vPosition;
    vec3 L = normalize(lightVector);
    float rSquered = dot(lightVector, lightVector);
    float lambert = max(dot(N, L), 0.0f) / (rSquered + lightCurve);
    float ambient = 0.0f;
    return vec3(lambert + ambient) * light.color * light.intensity;
}

void main() {
    vec3 ill = vec3(0);
    vec3 N = normalize(vNormal);
    for (int i = 0; i < LIGHT_COUNT; i++) {
        ill += getIlumination(uLights[i], N);
    }

    vec4 baseColor = texture(uBaseTexture, vTexCoord);
    oColor = uBaseFactor * baseColor * vec4(ill, 1);
}
