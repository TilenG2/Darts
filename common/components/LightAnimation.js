import { quat } from "../../lib/gl-matrix-module.js";
import { Transform } from "../engine/core.js";

export class LightAnimation {
    constructor(node, {
        maxAngle = 0.03,
        swingSpeed = 1,
    } = {}) {
        this.node = node;
        this.transform = new Transform();
        node.addComponent(this.transform);

        this.maxAngle = maxAngle;
        this.swingSpeed = swingSpeed;
    }
    update(t) {
        const angle = this.maxAngle * Math.sin(t * this.swingSpeed);

        const axis = [1, 0, 0];
        const rotation = quat.setAxisAngle(quat.create(), axis, angle);

        this.transform.rotation = rotation;
    }
}