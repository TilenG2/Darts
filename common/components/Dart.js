import { Transform, Model } from "../engine/core.js";
import { vec3, mat4, quat } from "../../lib/gl-matrix-module.js";

export class Dart {
  constructor(camera, dartNode, power) {
    this.cameraTransform = camera;
    this.dartNode = dartNode;
    this.transform =  null;
  
    this.speed = power/20 + 5;
    this.velocity = [0, 0, 0];
    this.acceleration = [0, -0.3, 0];
    this.rotationSpeed = -0.1;
    this.rotationAxisX = [1, 0, 0];
    this.rotationAxisZ = [0, 0, 1];
    this.stop = false;

    this.pickable = false;
    this.calculate = true;
    this.transDart();
  }

  transDart() {
      // Set Dart scene's position to the camera's position
      const sc = 0.05;
      let dartTransform = new Transform({
        translation:[...this.cameraTransform.translation],
        rotation:[...this.cameraTransform.rotation],
        scale:[sc, sc, sc]
      });

      this.transform = dartTransform;
    
      const forwardVector = [0, 0, -1];
      vec3.transformQuat(forwardVector, forwardVector, dartTransform.rotation);
      this.velocity = vec3.scale(forwardVector, forwardVector, this.speed);
  }
  
  calculateAABB(){
    return { 
      min : [-0.4454188346862793, -0.4339310824871063, -2.315728187561035],
      max : [0.4271223545074463, 0.437360942363739, 3.731476068496704]
    };
  }


  update(t, dt) {
    if(this.stop){
      return;
    }
    // Update velocity based on acceleration (gravity)
    this.velocity[0] += this.acceleration[0] * dt;
    this.velocity[1] += this.acceleration[1] * dt;
    this.velocity[2] += this.acceleration[2] * dt;

    // Update position based on velocity
    if(this.transform){
      this.transform.translation[0] += this.velocity[0] * dt;
      this.transform.translation[1] += this.velocity[1] * dt;
      this.transform.translation[2] += this.velocity[2] * dt;
      /*
      let rotationAngleZ = this.speed*dt;
      let rotationQuatZ = quat.setAxisAngle(quat.create(), this.rotationAxisZ, rotationAngleZ);
      quat.multiply(this.transform.rotation, this.transform.rotation, rotationQuatZ);
      */
      let rotationAngleX = this.rotationSpeed*dt;
      let rotationQuatX = quat.setAxisAngle(quat.create(), this.rotationAxisX, rotationAngleX);
      quat.multiply(this.transform.rotation, this.transform.rotation, rotationQuatX);
      
    };
  }

  tip(){
    let normalVelocity = vec3.create();
    vec3.normalize(normalVelocity, this.velocity);
    const x = this.transform.translation[0] + this.velocity[0]*0.02;
    const y = this.transform.translation[1] + this.velocity[1]*0.02;
    return { x, y };
  }
}