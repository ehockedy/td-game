import { state } from "./state.js"

var canvas = document.getElementById("game-canvas");
var ctx = canvas.getContext("2d");

ctx.fillStyle = "#FF0000";
//ctx.fillRect(0, 0, 150, 75);

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    console.log(state)
    renderEnemy(state["players"][0]["player1"]["x"], state["players"][0]["player1"]["y"])
}

function renderEnemy(x, y) {
    ctx.fillRect(x, y, 50, 50);
}

export function renderLoop() {
    console.log("In loop")
    setInterval(render, 50);
}

// Automatically start rendering on script load - TODO CHANGE THIS!
renderLoop()