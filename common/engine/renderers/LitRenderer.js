import { vec3, mat3, mat4, vec4 } from '../../../lib/gl-matrix-module.js';

import * as WebGL from '../WebGL.js';

import { BaseRenderer } from './BaseRenderer.js';

import {
    getLocalModelMatrix,
    getGlobalModelMatrix,
    getGlobalViewMatrix,
    getProjectionMatrix,
    getModels,
} from '../core/SceneUtils.js';
import { Light } from "../../../Light.js"

const lightIntensityMultyplyer = 0.0001; //bling
// const lightIntensityMultyplyer = 0.0012; // lambert
export class LitRenderer extends BaseRenderer {

    constructor(canvas) {
        super(canvas);
    }

    async initialize() {
        const gl = this.gl;

        const unlitVertexShader = await fetch(new URL('../shaders/lit.vs', import.meta.url))
            .then(response => response.text());

        const unlitFragmentShader = await fetch(new URL('../shaders/lit.fs', import.meta.url))
            .then(response => response.text());

        this.programs = WebGL.buildPrograms(gl, {
            unlit: {
                vertex: unlitVertexShader,
                fragment: unlitFragmentShader,
            },
        });

        gl.clearColor(1, 1, 1, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
    }

    render(scene, camera) {
        const gl = this.gl;

        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const { program, uniforms } = this.programs.unlit;
        gl.useProgram(program);

        const viewMatrix = getGlobalViewMatrix(camera);
        const projectionMatrix = getProjectionMatrix(camera);

        gl.uniformMatrix4fv(uniforms.uViewMatrix, false, viewMatrix);
        gl.uniformMatrix4fv(uniforms.uProjectionMatrix, false, projectionMatrix);
        gl.uniform3fv(uniforms.uCameraPosition, mat4.getTranslation(vec3.create(), getGlobalModelMatrix(camera)));

        const lights = scene.filter(node => node.getComponentOfType(Light));
        for (let i = 0; i < lights.length; i++) {
            const lightMatrix = getGlobalModelMatrix(lights[i]);
            const lightPosition = mat4.getTranslation(vec3.create(), lightMatrix);
            const lightComponent = lights[i].getComponentOfType(Light);
            const lightColor = lightComponent.color;
            const lightAttenuation = lightComponent.attenuation;
            const lightIntensity = lightComponent.intensity * lightIntensityMultyplyer;
            gl.uniform3fv(uniforms.uLights[i].position, lightPosition);
            gl.uniform3fv(uniforms.uLights[i].color, lightColor);
            gl.uniform3fv(uniforms.uLights[i].attenuation, lightAttenuation);
            gl.uniform1f(uniforms.uLights[i].intensity, lightIntensity);
        }

        this.renderNode(scene);
    }

    renderNode(node, modelMatrix = mat4.create()) {
        const gl = this.gl;

        const { program, uniforms } = this.programs.unlit;

        const localMatrix = getLocalModelMatrix(node);
        modelMatrix = mat4.mul(mat4.create(), modelMatrix, localMatrix);
        gl.uniformMatrix4fv(uniforms.uModelMatrix, false, modelMatrix);

        const normalMatrix = mat3.normalFromMat4(mat3.create(), modelMatrix);
        gl.uniformMatrix3fv(uniforms.uNormalMatrix, false, normalMatrix);

        const models = getModels(node);
        for (const model of models) {
            for (const primitive of model.primitives) {
                this.renderPrimitive(primitive);
            }
        }

        for (const child of node.children) {
            this.renderNode(child, modelMatrix);
        }
    }

    renderPrimitive(primitive) {
        const gl = this.gl;

        const { program, uniforms } = this.programs.unlit;

        const vao = this.prepareMesh(primitive.mesh);
        gl.bindVertexArray(vao);

        const material = primitive.material;

        const baseTexture = this.prepareImage(material.baseTexture.image, material.baseTexture.sRGB);
        const baseSampler = this.prepareSampler(material.baseTexture.sampler);
        const metalnessTexture = this.prepareImage(material.metalnessTexture.image, material.metalnessTexture.sRGB);
        const metalnessSampler = this.prepareSampler(material.metalnessTexture.sampler);
        const roughnessTexture = this.prepareImage(material.roughnessTexture.image, material.roughnessTexture.sRGB);
        const roughnessSampler = this.prepareSampler(material.roughnessTexture.sampler);

        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(uniforms.uBaseTexture, 0);
        gl.bindTexture(gl.TEXTURE_2D, baseTexture);
        gl.bindSampler(0, baseSampler);

        gl.activeTexture(gl.TEXTURE1);
        gl.uniform1i(uniforms.uMetalnessTexture, 1);
        gl.bindTexture(gl.TEXTURE_2D, metalnessTexture);
        gl.bindSampler(1, metalnessSampler);

        gl.activeTexture(gl.TEXTURE2);
        gl.uniform1i(uniforms.uRoughnessTexture, 2);
        gl.bindTexture(gl.TEXTURE_2D, roughnessTexture);
        gl.bindSampler(2, roughnessSampler);

        gl.uniform3fv(uniforms.uBaseFactor, material.baseFactor.slice(0, 3));
        gl.uniform1f(uniforms.uMetalnessFactor, material.metalnessFactor);
        gl.uniform1f(uniforms.uRoughnessFactor, material.roughnessFactor);

        const glTexture = this.prepareImage(material.baseTexture.image);
        const glSampler = this.prepareSampler(material.baseTexture.sampler);

        gl.bindTexture(gl.TEXTURE_2D, glTexture);
        gl.bindSampler(0, glSampler);

        gl.drawElements(gl.TRIANGLES, primitive.mesh.indices.length, gl.UNSIGNED_INT, 0);

        gl.bindVertexArray(null);
    }

}
