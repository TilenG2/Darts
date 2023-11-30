#version 300 es
precision mediump float;
precision mediump sampler2D;

#define LIGHT_COUNT 6

uniform sampler2D uBaseTexture;
uniform sampler2D uMetalnessTexture;
uniform sampler2D uRoughnessTexture;

uniform vec3 uBaseFactor;
uniform float uMetalnessFactor;
uniform float uRoughnessFactor;

uniform vec3 uCameraPosition;

struct Light {
    vec3 position;
    vec3 attenuation;
    vec3 color;
    float intensity;
};

uniform Light[LIGHT_COUNT] uLights;

in vec3 vPosition;
in vec3 vNormal;
in vec2 vTexCoord;

out vec4 oColor;

float lightCurve = 6.0f;

vec3 F_Schlick(vec3 f0, vec3 f90, float VdotH) {
    return f0 + (f90 - f0) * pow(clamp(1.0f - VdotH, 0.0f, 1.0f), 5.0f);
}

float F_Schlick(float f0, float f90, float VdotH) {
    return f0 + (f90 - f0) * pow(clamp(1.0f - VdotH, 0.0f, 1.0f), 5.0f);
}

float V_GGX(float NdotL, float NdotV, float roughness) {
    float roughnessSq = roughness * roughness;

    float GGXV = NdotV + sqrt(NdotV * NdotV * (1.0f - roughnessSq) + roughnessSq);
    float GGXL = NdotL + sqrt(NdotL * NdotL * (1.0f - roughnessSq) + roughnessSq);

    return 1.0f / (GGXV * GGXL);
}

float D_GGX(float NdotH, float roughness) {
    const float PI = 3.14159265358979f;
    float roughnessSq = roughness * roughness;
    float f = (NdotH * NdotH) * (roughnessSq - 1.0f) + 1.0f;
    return roughnessSq / (PI * f * f);
}

float Fd_Lambert() {
    const float PI = 3.14159265358979f;
    return 1.0f / PI;
}

float Fd_Burley(float NdotV, float NdotL, float VdotH, float roughness) {
    const float PI = 3.14159265358979f;
    float f90 = 0.5f + 2.0f * roughness * VdotH * VdotH;
    float lightScatter = F_Schlick(1.0f, f90, NdotL);
    float viewScatter = F_Schlick(1.0f, f90, NdotV);
    return lightScatter * viewScatter * (1.0f / PI);
}

vec3 BRDF_diffuse(vec3 f0, vec3 f90, vec3 diffuseColor, float VdotH) {
    const float PI = 3.14159265358979f;
    return (1.0f - F_Schlick(f0, f90, VdotH)) * (diffuseColor / PI);
}

vec3 BRDF_specular(vec3 f0, vec3 f90, float roughness, float VdotH, float NdotL, float NdotV, float NdotH) {
    vec3 F = F_Schlick(f0, f90, VdotH);
    float Vis = V_GGX(NdotL, NdotV, roughness);
    float D = D_GGX(NdotH, roughness);

    return F * Vis * D;
}

vec3 linearTosRGB(vec3 color) {
    const float gamma = 2.2f;
    return pow(color, vec3(1.0f / gamma));
}

vec3 sRGBToLinear(vec3 color) {
    const float gamma = 2.2f;
    return pow(color, vec3(gamma));
}

vec3 getLightIntensity(Light light, vec3 surfacePosition) {
    float d = distance(light.position, surfacePosition);
    float attenuation = dot(light.attenuation, vec3(1, d, d * d));
    return light.color * light.intensity / attenuation;
}

vec3 getIlumination(Light light) {
    vec3 N = normalize(vNormal);
    vec3 L = normalize(light.position - vPosition);
    vec3 V = normalize(uCameraPosition - vPosition);
    vec3 H = normalize(V + L);

    float NdotL = clamp(dot(N, L), 0.0f, 1.0f);
    float NdotV = clamp(dot(N, V), 0.0f, 1.0f);
    float NdotH = clamp(dot(N, H), 0.0f, 1.0f);
    float VdotH = clamp(dot(V, H), 0.0f, 1.0f);

    vec3 baseColor = texture(uBaseTexture, vTexCoord).rgb * uBaseFactor;
    float metalness = texture(uMetalnessTexture, vTexCoord).r * uMetalnessFactor;
    float perceptualRoughness = texture(uRoughnessTexture, vTexCoord).r * uRoughnessFactor * 10.0f;
    float roughness = perceptualRoughness * perceptualRoughness;

    vec3 f0 = mix(vec3(0.04f), baseColor, metalness);
    vec3 f90 = vec3(1);
    vec3 diffuseColor = mix(baseColor, vec3(0), metalness);
    vec3 lightIntensity = getLightIntensity(light, vPosition);

    vec3 diffuse = lightIntensity * NdotL * BRDF_diffuse(f0, f90, diffuseColor, VdotH);
    vec3 specular = lightIntensity * NdotL * BRDF_specular(f0, f90, roughness, VdotH, NdotL, NdotV, NdotH);

    return diffuse + specular;
}

void main() {
    vec3 ill = vec3(0);
    for (int i = 0; i < LIGHT_COUNT; i++) {
        ill += getIlumination(uLights[i]);
    }

    // vec4 baseColor = texture(uBaseTexture, vTexCoord);
    // oColor = vec4(uBaseFactor, 1) * baseColor * vec4(ill, 1);

    vec3 finalColor = ill;
    oColor = vec4(linearTosRGB(finalColor), 1);
}