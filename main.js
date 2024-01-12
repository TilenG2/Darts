import {
    Camera,
    Node,
    Transform,
    Model,
    Mesh
} from "./common/engine/core.js";
import { start } from "./ui.js";
const canvas = document.querySelector("canvas");
let urlParams = new URLSearchParams(window.location.search).get('dev');
let dev = urlParams == "true";
export let allowMove = false;
export function setAllowMove(value) {
    allowMove = value;
}
if (dev) {
    let log = function () {
        console.defaultLog.apply(console, arguments);
        Console.innerHTML += arguments[0] + "<br/>";
    }
    let logE = function () {
        console.defaultError.apply(console, arguments);
        Console.innerHTML += arguments[0] + "<br/>";
    }
    let logW = function () {
        console.defaultWarn.apply(console, arguments);
        Console.innerHTML += arguments[0] + "<br/>";
    }
    let logD = function () {
        console.defaultDebug.apply(console, arguments);
        Console.innerHTML += arguments[0] + "<br/>";
    }
    document.getElementById("consoleD").hidden = false;
    let Console = document.getElementById("console");
    console.defaultLog = console.log.bind(console);
    console.log = log;
    console.defaultError = console.error.bind(console);
    console.error = logE;
    console.defaultWarn = console.warn.bind(console);
    console.warn = logW;
    console.defaultDebug = console.debug.bind(console);
    console.debug = logD;
    start();
}
import { GLTFLoader } from "./common/engine/loaders/GLTFLoader.js";
import { LitRenderer } from "./common/engine/renderers/LitRenderer.js";
import { ResizeSystem } from "./common/engine/systems/ResizeSystem.js";
import { UpdateSystem } from "./common/engine/systems/UpdateSystem.js";
import { TurntableController } from "./common/engine/controllers/TurntableController.js";
import { LinearAnimator } from "./common/engine/animators/LinearAnimator.js";
import { Light } from "./common/components/Light.js"
import { getGlobalModelMatrix } from "./common/engine/core/SceneUtils.js";
import { FirstPersonController } from "./common/engine/controllers/FirstPersonController.js";

//For collision
import {
    calculateAxisAlignedBoundingBox,
    mergeAxisAlignedBoundingBoxes
} from "./common/engine/core/MeshUtils.js";
import { mat4 } from "./lib/gl-matrix-module.js";
import { Physics } from "./common/engine/core/Physics.js";
import { Dart } from "./common/components/Dart.js";
import { Dartboard } from "./common/components/Dartboard.js";
import { Balloon } from "./common/components/Balloon.js";
import { LightAnimation } from "./common/components/LightAnimation.js";

//Create renderer
const renderer = new LitRenderer(canvas);
await renderer.initialize();

//Load scene
const gltfLoader = new GLTFLoader();
await gltfLoader.load("common/models/prostor/prostor.gltf"); //GLTFSEperate
const scene = gltfLoader.loadScene(gltfLoader.defaultScene);

const animatedLight = gltfLoader.loadNode("Light4");
animatedLight.addComponent(new LightAnimation(animatedLight, {
    swing: true,
}));

const animatedLight2 = gltfLoader.loadNode("Light5");
animatedLight2.addComponent(new LightAnimation(animatedLight2, {
    flicker: true,
}));

//Setup camera
const camera = gltfLoader.loadNode("Camera");

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
    max: [0.2, 1.5, 0.2],
};

scene.traverse(node => {
    const model = node.getComponentOfType(Model);
    if (!model) {
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
let dartsLeft = [3];
const physics = new Physics(scene, dartsLeft);
scene.traverse(node => {
    const model = node.getComponentOfType(Model);
    if (!model) {
        return;
    }
    const boxes = model.primitives.map(primitive => calculateAxisAlignedBoundingBox(primitive.mesh));
    node.aabb = mergeAxisAlignedBoundingBoxes(boxes);
});

//Calculate Dart Board center
const pointsDisplay = document.getElementById("points");
let points = [0];
export function updatePointsDisplay() {
    pointsDisplay.textContent = points[0] + " points";
}
const darboardNode = gltfLoader.loadNode("Dartboard");
const dartBoard = new Dartboard(getGlobalModelMatrix(darboardNode), points);
darboardNode.addComponent(dartBoard);

//Balloons
for (let i = 0; i < 6; i++) {
    gltfLoader.loadNode("Balloon" + i).addComponent(new Balloon());
}

function update(t, dt) {
    scene.traverse(node => {
        for (const component of node.components) {
            component.update?.(t, dt);
        }
    });

    physics.update(t, dt);
}

//Dart Plate
let plate = gltfLoader.loadNode("Cube.015");
plate.aabb = {
    max: [2.5, 2, 1],
    min: [-1, -1, -1]
};
plate.isStatic = false;
plate.isPlate = true;

function render() {
    //Render the scene
    renderer.render(scene, camera);

}

function resize({ displaySize: { width, height } }) {
    camera.getComponentOfType(Camera).aspect = width / height;
}

new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ update, render }).start();

//Dart loading:
//1. Load dart node for quick acces.
await gltfLoader.load('common/models/dart/dart.gltf');
const dartNode = gltfLoader.loadNode('darts_obj');

/*
On click
2. Create new Node
3. Create new Dart Object and add it to the Node
4. Add node to the scene.
*/
export function addDart(power) {
    if (dartsLeft[0] > 0) {
        const dart = new Node();
        const myDart = new Dart(camera.getComponentOfType(Transform), dartNode, power);
        dart.addComponent(myDart.transform);
        dart.addComponent(dartNode.getComponentOfType(Model));
        dart.addComponent(myDart);
        dart.aabb = myDart.calculateAABB();
        dart.isDynamic = true;
        scene.addChild(dart);
        physics.scene = scene;
        dartsLeft[0]--;
    }
}

export function resetDarts(){
    dartsLeft[0] = 3;
}