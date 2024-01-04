import { addDart, setAllowMove } from "./main.js";
let canvas;
let braker;
export function start() {
    setAllowMove(true);
    document.getElementById("intro").hidden = true
    canvas = document.getElementsByTagName("canvas")[0]
    braker = document.getElementById("braker")
    braker.hidden = true
    canvas.click()
    document.addEventListener("mousedown", mousepress);
    document.addEventListener("mouseup", function () {
        ThrowDiv.hidden = true;
        clearInterval(interval);
        addDart(DartStrength);
    });
}
document.getElementById("startButton").addEventListener("click", start);
let ThrowDiv = document.getElementById("ThrowDiv");
let ThrowStrengthDiv = document.getElementById("ThrowStrength");
let DartStrength;
let change = 5;
let interval;
function mousedown() {
    if (DartStrength==100 || DartStrength==0) {
        change = -change;
    }
    DartStrength += change;
    ThrowStrengthDiv.style.height = DartStrength + "%";
}
function mousepress() {
    change = 5;
    ThrowStrengthDiv.style.height = "1px";
    DartStrength = 5;
    ThrowDiv.hidden = false;
    interval = setInterval(mousedown, 20);
}