import {
    Camera,
    Node,
    Transform,
    Model,
    Mesh
} from "./common/engine/core.js";

import { GLTFLoader } from "./common/engine/loaders/GLTFLoader.js";
import { LitRenderer } from "./common/engine/renderers/LitRenderer.js";
import { ResizeSystem } from "./common/engine/systems/ResizeSystem.js";
import { UpdateSystem } from "./common/engine/systems/UpdateSystem.js";
import { TurntableController } from "./common/engine/controllers/TurntableController.js";
import { LinearAnimator } from "./common/engine/animators/LinearAnimator.js";
import { Light } from "./Light.js"

import { FirstPersonController } from "./common/engine/controllers/FirstPersonController.js";

//For collision
import {
    calculateAxisAlignedBoundingBox,
    mergeAxisAlignedBoundingBoxes
} from "./common/engine/core/MeshUtils.js";

import { Physics } from "./common/engine/core/Physics.js";

//Create renderer
const canvas = document.querySelector("canvas");
const renderer = new LitRenderer(canvas);
await renderer.initialize();

//Load scene
const gltfLoader = new GLTFLoader();
await gltfLoader.load("common/models/prostor/prostor.gltf"); //GLTFSEperate

const scene = gltfLoader.loadScene(gltfLoader.defaultScene);

//Setup camera
const camera = scene.find(node => node.getComponentOfType(Camera));

// camera.addComponent(new TurntableController(camera, document.body, {
//     distance: 10
// }));
camera.addComponent(new FirstPersonController(camera, canvas));
// camera.addComponent(new Transform({}))

// Set up model
// const model = gltfLoader.loadNode('darts_obj');
// // const model = scene.find(node => node.getComponentOfType(Model));
// model.addComponent(new LinearAnimator(model, {
//     startPosition: [0, 0, 0],
//     endPosition: [20, 0, 0],
//     duration: 1,
//     loop: true
// }));

//Collision
camera.isDynamic = true;
camera.aabb = {
    min: [-0.2, -2, -0.2],
    max: [0.2, 1, 0.2],
};

scene.traverse(node => {
    const model = node.getComponentOfType(Model);
    if(!model){
        return;
    }
    
    node.isStatic = true;
});

/*
For all nodes that have isStatic and that are model,
calculates Axis Aliged Bounding Box:
Axis Aligned: edges of bounding box are parallel to coordiante axes (It is aligned with global coordinate system)
Bounding Box: 3D rectanguar enclosure that compeltly contains a set of objects.
*/
let i = 0;
const physics = new Physics(scene);
scene.traverse(node => {
    const model = node.getComponentOfType(Model);
    if ((!model) || (!node.isStatic)) {
        return;
    }
    i++;
    console.log(i);
    const boxes = model.primitives.map(primitive => calculateAxisAlignedBoundingBox(primitive.mesh));
    node.aabb = mergeAxisAlignedBoundingBoxes(boxes);
});


function update(t, dt) {
    scene.traverse(node => {
        for (const component of node.components) {
            component.update?.(t, dt);
        }
    });

    physics.update(t, dt);
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
