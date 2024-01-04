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
import { Light } from "../../components/Light.js"
import { shaders } from '../shaders/shaders.js';

const lightIntensityMultyplyer = 0.0001; //bling
// const lightIntensityMultyplyer = 0.0012; // lambert
const afectedLight = 3;
export class LitRenderer extends BaseRenderer {

    constructor(canvas) {
        super(canvas);
    }

    async initialize() {
        const gl = this.gl;

        gl.clearColor(1, 1, 1, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        this.programs = WebGL.buildPrograms(gl, shaders);

        this.shadowMapSize = 1024;

        this.createShadowBuffers();

        // this.displayDebug();
    }

    render(scene, camera) {
        const lights = scene.filter(node => node.getComponentOfType(Light));

        this.renderShadows(scene, lights);
        this.renderGeometry(scene, camera, lights);
        // this.displayDebug(2);
    }

    renderShadows(scene, lights) {
        const gl = this.gl;

        gl.enable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        gl.cullFace(gl.FRONT);

        const size = {
            width: this.shadowMapSize,
            height: this.shadowMapSize,
        };

        for (let i = 0; i < lights.length; i++) {

            gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowBuffers[i].framebuffer);
            gl.viewport(0, 0, size.width, size.height);

            gl.clearDepth(1);
            gl.clear(gl.DEPTH_BUFFER_BIT);

            const { program, uniforms } = this.programs.renderShadows;
            gl.useProgram(program);

            const shadowCamera = lights[i];
            const lightTransformMatrix = getGlobalViewMatrix(shadowCamera);
            const lightProjectionMatrix = getProjectionMatrix(shadowCamera);
            const lightMatrix = mat4.mul(mat4.create(), lightProjectionMatrix, lightTransformMatrix);
            gl.uniformMatrix4fv(uniforms.uLightMatrix, false, lightMatrix);


            const modelMatrix = mat4.create();
            for (const node of scene.children) {
                this.renderNode(node, modelMatrix, uniforms);
            }
        }
    }

    displayDebug(shadowBuffer) {
        const gl = this.gl;

        const buffer = WebGL.createBuffer(gl, {
            data: new Float32Array([
                -1, -1, /* vertex 0 position */
                1, -1, /* vertex 1 position */
                -1, 1, /* vertex 2 position */

                -1, 1, /* vertex 2 position */
                1, -1, /* vertex 1 position */
                1, 1 /* vertex 2 position */
            ])
        });

        const sampler = gl.createSampler();
        gl.samplerParameteri(sampler, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.samplerParameteri(sampler, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

        gl.clear(gl.DEPTH_BUFFER_BIT);

        const { program, uniforms } = this.programs.renderDebug;
        gl.useProgram(program);

        const white = new ImageData(new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 0, 255]), 2, 2);

        const texture = this.shadowBuffers[shadowBuffer].depthTexture;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(uniforms.uTexture, 0);

        gl.bindSampler(0, sampler);

        gl.enableVertexAttribArray(0);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

    }

    renderGeometry(scene, camera, lights) {
        const gl = this.gl;

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);

        const size = {
            width: gl.drawingBufferWidth,
            height: gl.drawingBufferHeight,
        };

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, size.width, size.height);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const { program, uniforms } = this.programs.renderGeometry;
        gl.useProgram(program);

        const viewMatrix = getGlobalViewMatrix(camera);
        const projectionMatrix = getProjectionMatrix(camera);

        for (let i = 0; i < lights.length; i++) {
            const shadowCamera = lights[i];
            const lightTransformMatrix = getGlobalViewMatrix(shadowCamera);
            const lightProjectionMatrix = getProjectionMatrix(shadowCamera);
            const lightMatrix = mat4.mul(mat4.create(), lightProjectionMatrix, lightTransformMatrix);
            gl.uniformMatrix4fv(uniforms.uLightMatrix[i], false, lightMatrix);
            gl.activeTexture(gl.TEXTURE3 + i);
            // console.log(gl.TEXTURE3 + i)
            gl.uniform1i(uniforms.uDepth[i], 3 + i);
            // console.log(uniforms.uDepth);
            gl.bindTexture(gl.TEXTURE_2D, this.shadowBuffers[i].depthTexture);
            // console.log(this.shadowBuffers);
        }

        gl.uniformMatrix4fv(uniforms.uViewMatrix, false, viewMatrix);
        gl.uniformMatrix4fv(uniforms.uProjectionMatrix, false, projectionMatrix);
        gl.uniform3fv(uniforms.uCameraPosition, mat4.getTranslation(vec3.create(), getGlobalModelMatrix(camera)));

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

        const modelMatrix = mat4.create();
        for (const node of scene.children) {
            this.renderNode(node, modelMatrix, uniforms);
        }
    }

    renderNode(node, modelMatrix = mat4.create(), uniforms) {
        const gl = this.gl;

        const localMatrix = getLocalModelMatrix(node);
        modelMatrix = mat4.mul(mat4.create(), modelMatrix, localMatrix);
        gl.uniformMatrix4fv(uniforms.uModelMatrix, false, modelMatrix);

        const normalMatrix = mat3.normalFromMat4(mat3.create(), modelMatrix);
        gl.uniformMatrix3fv(uniforms.uNormalMatrix, false, normalMatrix);

        const models = getModels(node);
        for (const model of models) {
            for (const primitive of model.primitives) {
                this.renderPrimitive(primitive, uniforms);
            }
        }

        for (const child of node.children) {
            this.renderNode(child, modelMatrix, uniforms);
        }
    }

    renderPrimitive(primitive, uniforms) {
        const gl = this.gl;

        const vao = this.prepareMesh(primitive.mesh);
        gl.bindVertexArray(vao);
        // console.log(primitive);

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

        // const glTexture = this.prepareImage(material.baseTexture.image);
        // const glSampler = this.prepareSampler(material.baseTexture.sampler);

        // gl.bindTexture(gl.TEXTURE_2D, glTexture);
        // gl.bindSampler(0, glSampler);

        gl.drawElements(gl.TRIANGLES, primitive.mesh.indices.length, gl.UNSIGNED_INT, 0);

        gl.bindVertexArray(null);
    }

    createShadowBuffers() {
        const gl = this.gl;

        if (this.shadowBuffers) {
            for (const shadowBuffer of this.shadowBuffers) {
                gl.deleteFramebuffer(shadowBuffer.framebuffer);
                gl.deleteTexture(shadowBuffer.depthTexture);
            }
        }
        this.shadowBuffers = [];

        const size = {
            width: this.shadowMapSize,
            height: this.shadowMapSize,
        };

        const sampling = {
            min: gl.LINEAR,
            mag: gl.LINEAR,
            wrapS: gl.CLAMP_TO_EDGE,
            wrapT: gl.CLAMP_TO_EDGE,
        };

        for (let i = 0; i < 6; i++) {
            const depthBuffer = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH24_STENCIL8, size.width, size.height);

            const depthTexture = WebGL.createTexture(gl, {
                ...size,
                ...sampling,
                format: gl.DEPTH_STENCIL,
                iformat: gl.DEPTH24_STENCIL8,
                type: gl.UNSIGNED_INT_24_8,
            });
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);

            const framebuffer = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);

            // gl.drawBuffers([]);

            this.shadowBuffers[i] = {
                framebuffer,
                depthTexture,
            };
        }

    }

}
