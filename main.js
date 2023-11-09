// import { GUI } from '../../../lib/dat.gui.module.js';

import { ResizeSystem } from './engine/systems/ResizeSystem.js';
import { UpdateSystem } from './engine/systems/UpdateSystem.js';

import { ImageLoader } from './engine/loaders/ImageLoader.js';
import { OBJLoader } from './engine/loaders/OBJLoader.js';

import { OrbitController } from './engine/controllers/OrbitController.js';

import {
    Camera,
    Material,
    Model,
    Node,
    Primitive,
    Sampler,
    Texture,
    Transform,
} from './engine/core.js';

import { UnlitRenderer } from './renders/UnlitRenderer.js';
import { Light } from './Light.js';

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');
const renderer = new UnlitRenderer(gl);

const scene = new Node();

const camera = new Node();
camera.addComponent(new Transform());
camera.addComponent(new Camera({
    near: 0.1,
    far: 100,
}));
camera.addComponent(new OrbitController(camera, canvas));
scene.addChild(camera);

const light = new Node();
light.addComponent(new Light({
    direction: [-1, 1, 1],
}));
scene.addChild(light);

const model = new Node();
model.addComponent(new Model({
    primitives: [
        new Primitive({
            mesh: await new OBJLoader().loadMesh('./objects/dart.obj'),
            material: new Material({
                baseTexture: new Texture({
                    image: await new ImageLoader().load('./img/static.jpg'),
                    sampler: new Sampler({
                        minFilter: 'nearest',
                        magFilter: 'nearest',
                    }),
                }),
            }),
        }),
    ],
}));
scene.addChild(model);

function update(time, dt) {
    scene.traverse(node => {
        for (const component of node.components) {
            component.update?.(time, dt);
        }
    });
}

function render() {
    renderer.render(scene, camera, light);
}

function resize({ displaySize: { width, height } }) {
    camera.getComponentOfType(Camera).aspect = width / height;
}

new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ update, render }).start();