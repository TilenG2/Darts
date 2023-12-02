let canvas;
let braker;
allowMove = false
function start() {
    allowMove = true
    document.getElementById("intro").hidden = true
    canvas = document.getElementsByTagName("canvas")[0]
    braker = document.getElementById("braker")
    braker.hidden = true
    canvas.click()
}