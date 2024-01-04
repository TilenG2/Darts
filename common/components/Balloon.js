import { Transform, Model } from "../engine/core.js";
import { vec3, mat4, quat } from "../../lib/gl-matrix-module.js";

export class Balloon {
  constructor() {
  }
  
  calculateAABB(){
    return { 
      min : [-0.4454188346862793, -0.4339310824871063, -2.315728187561035],
      max : [0.4271223545074463, 0.437360942363739, 3.731476068496704]
    };
  }
}