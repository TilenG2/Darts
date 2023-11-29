export class Light {

    constructor({
        color = [255, 255, 255],
        intensity = 1,
    } = {}) {
        this.color = color;
        this.intensity = intensity;
    }

}
