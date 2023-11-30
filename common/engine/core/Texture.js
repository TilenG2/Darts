export class Texture {

    constructor({
        image,
        sampler,
        sRGB = true,
    } = {}) {
        this.image = image;
        this.sampler = sampler;
        this.sRGB = sRGB;
    }

    get width() {
        return this.image.width;
    }

    get height() {
        return this.image.height;
    }

}
