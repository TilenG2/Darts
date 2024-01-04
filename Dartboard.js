import { getGlobalModelMatrix } from "./common/engine/core/SceneUtils.js";
export class Dartboard {
  constructor (dartBoard){
    this.dartBoard = dartBoard;
    this.globalMatrixDartBoard = this.gGM(this.dartBoard);
    this.dartBoardCenter = [
      this.globalMatrixDartBoard[12],
      this.globalMatrixDartBoard[13],
      this.globalMatrixDartBoard[14],
    ];
    this.angles = this.calculateAngles();
    
  }

  gGM(dartBoard){
    return getGlobalModelMatrix(dartBoard);
  }

  calculateAngles(){
    const allAngles = [];
    let maxFirst = 2*Math.PI/40;
    let minFirst = 2*Math.PI-2*Math.PI/40;
    allAngles.push([maxFirst, minFirst]);
    for(let i = 1; i < 20; i++){
      minFirst = maxFirst;
      maxFirst = maxFirst + 2*Math.PI/20;
      allAngles.push([maxFirst, minFirst]);
    }
    return allAngles;
  }

}