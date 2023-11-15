import {
    Camera,
    Node,
    Transform,
    Model
} from "./common/engine/core.js";

import { GLTFLoader } from "./common/engine/loaders/GLTFLoader.js";
import { LitRenderer } from "./common/engine/renderers/LitRenderer.js";
import { ResizeSystem } from "./common/engine/systems/ResizeSystem.js";
import { UpdateSystem } from "./common/engine/systems/UpdateSystem.js";
import { TurntableController } from "./common/engine/controllers/TurntableController.js";
import { LinearAnimator } from "./common/engine/animators/LinearAnimator.js";
import { Light } from "./Light.js"

import { FirstPersonController } from "./common/engine/controllers/FirstPersonController.js"

//Create renderer
const canvas = document.querySelector("canvas");
const renderer = new LitRenderer(canvas);
await renderer.initialize();

//Load scene
const gltfLoader = new GLTFLoader();
await gltfLoader.load("common/models/dart/dart.gltf"); //GLTFSEperate

const scene = gltfLoader.loadScene(gltfLoader.defaultScene);

//Setup camera
const camera = scene.find(node => node.getComponentOfType(Camera));
// camera.addComponent(new TurntableController(camera, document.body, {
//     distance: 10
// }));
camera.addComponent(new FirstPersonController(camera, canvas));
// camera.addComponent(new Transform({}))

// Set up model
const model = gltfLoader.loadNode('darts_obj');
// const model = scene.find(node => node.getComponentOfType(Model));
// model.addComponent(new LinearAnimator(model, {
//     startPosition: [0, 0, 0],
//     endPosition: [20, 0, 0],
//     duration: 1,
//     loop: true
// }));

// Crate light
const light = new Node();
light.addComponent(new Transform({
    translation: [0, 2, 0]
}));
light.addComponent(new Light());
scene.addChild(light);

function update(t, dt) {
    scene.traverse(node => {
        for (const component of node.components) {
            component.update?.(t, dt);
        }
    })
}

function render() {
    //Render the scene
    renderer.render(scene, camera);
}

function resize({ displaySize: { width, height } }) {
    camera.getComponentOfType(Camera).aspect = width / height;
}

new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ update, render }).start();