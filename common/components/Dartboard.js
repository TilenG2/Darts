import { updatePointsDisplay } from "../../main.js";
export class Dartboard {
  constructor (dartBoard, points){
    this.globalMatrixDartBoard = dartBoard;
    this.dartBoardCenter = [
      this.globalMatrixDartBoard[12],
      this.globalMatrixDartBoard[13],
      this.globalMatrixDartBoard[14]
    ];
    this.availablePoints = [6,13,4,18,1,20,5,12,9,14,11,8,16,7,19,3,17,2,15,10,18,39,12,54,3,60,15,36,27,42,33,
                            24,48,21,57,9,51,6,45,30,6,13,4,18,1,20,5,12,9,14,11,8,16,7,19,3,17,2,15,10,12,26,8,
                            36,2,40,10,24,18,28,22,16,32,14,38,6,34,4,30,20];

    this.angles = [6.126105674500097, 0.15707963267948966, 0.47123889803846897, 0.7853981633974483,
      1.0995574287564276, 1.413716694115407, 1.7278759594743862, 2.0420352248333655, 2.356194490192345,
      2.670353755551324, 2.9845130209103035, 3.2986722862692828, 3.612831551628262, 3.9269908169872414,
      4.241150082346221, 4.5553093477052, 4.869468613064179, 5.183627878423159, 5.497787143782138,
      5.811946409141117, 6.126105674500097
    ];

    this.radiuses = [0.017351, 0.041682, 0.176507, 0.198979, 0.2847, 0.30684];
    this.pointsRule = this.calculateRanges();
    this.points = points;
    this.calculateRanges();
  }

  calculateAngles(){
    const allAngles = [];
    let maxFirst = 2*Math.PI/40;
    let minFirst = 2*Math.PI-2*Math.PI/40;
    allAngles.push(minFirst, maxFirst);
    for(let i = 1; i < 20; i++){
      maxFirst = maxFirst + 2*Math.PI/20;
      allAngles.push(maxFirst);
    }
    return allAngles;
  }

  calculatePoints(dartTip){
    const x = Math.abs(dartTip.x)-this.dartBoardCenter[0];
    const y = Math.abs(dartTip.y)-this.dartBoardCenter[1];
    const pitagora = Math.sqrt(x*x+y*y);
    if(pitagora <= this.radiuses[0]){
      this.points[0] += this.pointsRule[this.radiuses[0]];
      updatePointsDisplay();
      return;
    }else if(this.radiuses[0] < pitagora && pitagora <= this.radiuses[1]){
      this.points[0] += this.pointsRule[this.radiuses[1]];
      updatePointsDisplay();
      return;
    }else{
      for(let i = 1; i < 5; i++){
        if(this.radiuses[i] < pitagora && pitagora <= this.radiuses[i+1]){
          let dartAngle = Math.atan2(dartTip.y-this.dartBoardCenter[1], dartTip.x-this.dartBoardCenter[0]);
          if(dartAngle < 0){
            dartAngle+=2*Math.PI;
          }
          const ruleRadius = this.radiuses[i+1];
          if(this.angles[0] < dartAngle || dartAngle <= this.angles[1]){
            this.points[0] += this.pointsRule[[[ruleRadius, this.angles[0], this.angles[1]]]];
            updatePointsDisplay();
            return;
          }else{
            for(let j = 1; j < this.angles.length-1; j++){
              if((this.angles[j] < dartAngle) && (dartAngle <= this.angles[j+1])){
                this.points[0] += this.pointsRule[[[ruleRadius, this.angles[j], this.angles[j+1]]]];
                updatePointsDisplay();
                return;
              }
            }
          }
        }
      }
    }
  }

  calculateRanges(){
    const dict = {}
    let counter = 0;
    dict[0.017351] = 50;
    dict[0.041682] = 25;
    for(let i = 2; i<this.radiuses.length; i++){
      for(let j = 0; j < this.angles.length-1; j++){
        dict[[[this.radiuses[i], this.angles[j], this.angles[j+1]]]] = this.availablePoints[counter];
        counter++;
      }
    }
    return dict;
  }


}