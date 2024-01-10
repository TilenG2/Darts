import { Dart } from '../../components/Dart.js';
import { Balloon } from '../../components/Balloon.js';
import { Dartboard } from '../../components/Dartboard.js';
import { vec3, mat4 } from '../../../lib/gl-matrix-module.js';
import { getGlobalModelMatrix } from './SceneUtils.js';
import { Transform } from './Transform.js';
import { Camera } from './Camera.js';
import { resetDarts } from '../../../main.js';
let balloonPopSound = new Audio("common/audio/balloon.wav");

export class Physics {

    constructor(scene, dartsLeft) {
        this.scene = scene;
        this.dartsLeft = dartsLeft;
    }
    /*
    Traverses trough all nodes in the scene, checks if any Dynamic 
    node is is in collision with Static node and calls resolveCollision.
    */
    update(t, dt) {
        this.scene.traverse(node => {
            if (node.isDynamic) {
                this.scene.traverse(other => {
                    if (node !== other && (other.isStatic || (node.getComponentOfType(Camera) && (other.getComponentOfType(Dart)?.pickable || other.isPlate)))) {
                        this.resolveCollision(node, other);
                    }
                });
            }
        });
    }
 //5.Physics: scene.traverse{if (dart) (if dart is coliding) node.isDynamic = false}
    /*
    Checks if two intervals defined by their minimum and maximum values intesect.
    true = intesection
    false = no intersection
    */
    intervalIntersection(min1, max1, min2, max2) {
        return !(min1 > max2 || min2 > max1);
    }

    /*
    Checks if two axis-aligned bounding boxes intesect,
    by checking for intersections along each axis using intervalIntersection.
    */
    aabbIntersection(aabb1, aabb2) {
        return this.intervalIntersection(aabb1.min[0], aabb1.max[0], aabb2.min[0], aabb2.max[0])
            && this.intervalIntersection(aabb1.min[1], aabb1.max[1], aabb2.min[1], aabb2.max[1])
            && this.intervalIntersection(aabb1.min[2], aabb1.max[2], aabb2.min[2], aabb2.max[2]);
    }

    getTransformedAABB(node) {
        // Transform all vertices of the AABB from local to global space.
        const matrix = getGlobalModelMatrix(node);
        const { min, max } = node.aabb;
        const vertices = [
            [min[0], min[1], min[2]],
            [min[0], min[1], max[2]],
            [min[0], max[1], min[2]],
            [min[0], max[1], max[2]],
            [max[0], min[1], min[2]],
            [max[0], min[1], max[2]],
            [max[0], max[1], min[2]],
            [max[0], max[1], max[2]],
        ].map(v => vec3.transformMat4(v, v, matrix));

        // Find new min and max by component.
        const xs = vertices.map(v => v[0]);
        const ys = vertices.map(v => v[1]);
        const zs = vertices.map(v => v[2]);
        const newmin = [Math.min(...xs), Math.min(...ys), Math.min(...zs)];
        const newmax = [Math.max(...xs), Math.max(...ys), Math.max(...zs)];
        return { min: newmin, max: newmax };
    }

    resolveCollision(a, b) {
        // Get global space AABBs.
        const aBox = this.getTransformedAABB(a);
        const bBox = this.getTransformedAABB(b);

        // Check if there is collision.
        const isColliding = this.aabbIntersection(aBox, bBox);
        if (!isColliding) {
            return;
        }

        // Move node A minimally to avoid collision.
        const diffa = vec3.sub(vec3.create(), bBox.max, aBox.min);
        const diffb = vec3.sub(vec3.create(), aBox.max, bBox.min);

        let minDiff = Infinity;
        let minDirection = [0, 0, 0];
        if (diffa[0] >= 0 && diffa[0] < minDiff) {
            minDiff = diffa[0];
            minDirection = [minDiff, 0, 0];
        }
        if (diffa[1] >= 0 && diffa[1] < minDiff) {
            minDiff = diffa[1];
            minDirection = [0, minDiff, 0];
        }
        if (diffa[2] >= 0 && diffa[2] < minDiff) {
            minDiff = diffa[2];
            minDirection = [0, 0, minDiff];
        }
        if (diffb[0] >= 0 && diffb[0] < minDiff) {
            minDiff = diffb[0];
            minDirection = [-minDiff, 0, 0];
        }
        if (diffb[1] >= 0 && diffb[1] < minDiff) {
            minDiff = diffb[1];
            minDirection = [0, -minDiff, 0];
        }
        if (diffb[2] >= 0 && diffb[2] < minDiff) {
            minDiff = diffb[2];
            minDirection = [0, 0, -minDiff];
        }

        const transform = a.getComponentOfType(Transform);
        if (!transform) {
            return;
        }
        
        vec3.add(transform.translation, transform.translation, minDirection);

        if(a.getComponentOfType(Dart) && minDirection){
            if(b.getComponentOfType(Balloon)){
                this.scene.removeChild(b);
                balloonPopSound.play();
            }else if(b.getComponentOfType(Dartboard)){
                a.getComponentOfType(Dart).stop = true;
                const myDart = a.getComponentOfType(Dart);
                if(myDart.calculate){
                    const myDartboard = b.getComponentOfType(Dartboard);
                    myDartboard.calculatePoints(myDart.tip());
                    myDart.calculate = false;
                }          
                a.getComponentOfType(Dart).pickable = true;
            }else{
                a.getComponentOfType(Dart).stop = true;
                a.getComponentOfType(Dart).pickable = true;
            }
        }

        if(a.getComponentOfType(Camera) && b.getComponentOfType(Dart)?.pickable && minDirection){
            this.scene.removeChild(b);
            this.dartsLeft[0]++;
        }

        if(a.getComponentOfType(Camera) && b.isPlate && minDirection){
            this.scene.traverse(node => {
                if(node.getComponentOfType(Dart)){
                    this.scene.removeChild(node);
                }
            });
            resetDarts();
        }
    }

}