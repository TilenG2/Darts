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

const lightIntensityMultyplyer = 0.0012;
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

        const lights = scene.filter(node => node.getComponentOfType(Light));
        for (let i = 0; i < lights.length; i++) {
            const lightMatrix = getGlobalModelMatrix(lights[i]);
            const lightPosition = mat4.getTranslation(vec3.create(), lightMatrix);
            const lightComponent = lights[i].getComponentOfType(Light);
            const lightColor = lightComponent.color;
            const lightIntensity = lightComponent.intensity * lightIntensityMultyplyer;
            gl.uniform3fv(uniforms.uLights[i].position, lightPosition);
            gl.uniform3fv(uniforms.uLights[i].color, lightColor);
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




        // lights.forEach(light => {
        //     lightPosition = mat4.getTranslation(vec3.create(), getGlobalModelMatrix(light));
        //     if (vec3.distance(lightPosition, modelPosition) < distance[0]) {
        //         distance[0] = vec3.distance(lightPosition, modelPosition);
        //         lightMatrix = getGlobalModelMatrix(light);
        //     }
        // });
        // lightPosition = mat4.getTranslation(vec3.create(), lightMatrix);
        // gl.uniform3fv(uniforms.uLightPosition1, lightPosition);


        // lights.forEach(light => {
        //     lightPosition = mat4.getTranslation(vec3.create(), getGlobalModelMatrix(light));
        //     var dist = vec3.distance(lightPosition, modelPosition);
        //     if (dist < distance[1] && distance[0] < dist) {
        //         distance[1] = vec3.distance(lightPosition, modelPosition);
        //         lightMatrix = getGlobalModelMatrix(light);
        //     }
        // });
        // lightPosition = mat4.getTranslation(vec3.create(), lightMatrix);
        // gl.uniform3fv(uniforms.uLightPosition2, lightPosition);


        // lights.forEach(light => {
        //     lightPosition = mat4.getTranslation(vec3.create(), getGlobalModelMatrix(light));
        //     var dist = vec3.distance(lightPosition, modelPosition);
        //     if (dist < distance[2] && distance[1] < dist) {
        //         distance[2] = vec3.distance(lightPosition, modelPosition);
        //         lightMatrix = getGlobalModelMatrix(light);
        //     }
        // });
        // lightPosition = mat4.getTranslation(vec3.create(), lightMatrix);
        // gl.uniform3fv(uniforms.uLightPosition3, lightPosition);


        // lights.forEach(light => {
        //     lightPosition = mat4.getTranslation(vec3.create(), getGlobalModelMatrix(light));
        //     var dist = vec3.distance(lightPosition, modelPosition);
        //     if (dist < distance[3] && distance[2] < dist) {
        //         distance[3] = vec3.distance(lightPosition, modelPosition);
        //         lightMatrix = getGlobalModelMatrix(light);
        //     }
        // });
        // // console.log(distance)
        // lightPosition = mat4.getTranslation(vec3.create(), lightMatrix);
        // gl.uniform3fv(uniforms.uLightPosition4, lightPosition);


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
        gl.uniform4fv(uniforms.uBaseFactor, material.baseFactor);

        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(uniforms.uBaseTexture, 0);

        const glTexture = this.prepareImage(material.baseTexture.image);
        const glSampler = this.prepareSampler(material.baseTexture.sampler);

        gl.bindTexture(gl.TEXTURE_2D, glTexture);
        gl.bindSampler(0, glSampler);

        gl.drawElements(gl.TRIANGLES, primitive.mesh.indices.length, gl.UNSIGNED_INT, 0);

        gl.bindVertexArray(null);
    }

}
