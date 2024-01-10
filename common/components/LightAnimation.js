import { quat } from "../../lib/gl-matrix-module.js";
import { Transform } from "../engine/core.js";
import { Light } from "./Light.js";

export class LightAnimation {
    constructor(node, {
        swing = false,
        swingAngleMax = 0.03,
        swingSpeed = 1,
        flicker = false,
        flickerDuration = 30,
        flickerChance = 0.01,
    } = {}) {
        this.node = node;
        this.transform = new Transform();
        node.addComponent(this.transform);
        this.light = node.getComponentOfType(Light);

        this.swing = swing;
        this.swingAngleMax = swingAngleMax;
        this.swingSpeed = swingSpeed;

        this.flicker = flicker;
        this.flickerChance = flickerChance;
        this.lightIntensity = this.light.intensity

        this.on = true;
    }
    update(t) {
        if (this.swing) {
            const angle = this.swingAngleMax * Math.sin(t * this.swingSpeed);

            const axis = [1, 0, 0];
            const rotation = quat.setAxisAngle(quat.create(), axis, angle);

            this.transform.rotation = rotation;
        }
        if (this.flicker) {
            if (Math.random() < this.flickerChance) {
                this.on = !this.on;
            }
            if (this.on) {
                this.light.intensity = this.lightIntensity;
            } else {
                this.light.intensity = 0;
            }
        }
    }
}