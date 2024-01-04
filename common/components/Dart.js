import { Transform, Model } from "../engine/core.js";
import { vec3, mat4, quat } from "../../lib/gl-matrix-module.js";

export class Dart {
  constructor(camera, dartNode) {
    this.cameraTransform = camera;
    this.dartNode = dartNode;
    this.transform =  null;
  
    this.velocity = [0, 0, 0];
    this.acceleration = [0, -0.01, 0];
    this.rotationSpeed = -0.01;
    this.rotationAxisX = [0, 0, 1];
    this.rotationAxisY = [1, 0, 0];
    this.stop = false;

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
      this.velocity = vec3.scale(forwardVector, forwardVector, 1);
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

      let rotationAngleY = this.rotationSpeed*dt;
      let rotationQuatY = quat.setAxisAngle(quat.create(), this.rotationAxisY, rotationAngleY);
      quat.multiply(this.transform.rotation, this.transform.rotation, rotationQuatY);
    };
  }

}


/*

// na začetek loadanja igre
    2-4 click
    1. load('./common/models/dart/dart.gltf').loadNode("darts_obj");
    2. new Node()
    3. to node addComponent(Dart);
    4. scene.addChild(Node)
    //5.Physics: scene.traverse{if (dart) (if dart is coliding) node.isDynamic = false}
    

direktno na mesh povezi aabb za dart da ga ne rabs vedno na novo narest

TargetArea {
  radiusRange: [0.1, 2.2]
  angle.range: [0.0123, o.234]
  2pi/20
  +-2pi/40
  isPointinsied(x,y){

  }
}


*/


/*const alignedWithNegativeY = vec3.dot([0, this.transform.rotation[1], 0], [0, -1, 0] > 0.99);
      if(!alignedWithNegativeY){
        const rotationAngle = this.rotationSpeed * dt;
        const rotation = quat.create();
        quat.rotateY(rotation, rotation, rotationAngle);
        this.transform.rotation = rotation;
      };*/
      //this.resolveCollisions();