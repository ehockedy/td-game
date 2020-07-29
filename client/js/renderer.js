import { state, board } from "./state.js"

function render() {
    console.log(state)
}


export function renderLoop() {
    console.log("In loop")
    setInterval(render, 50);
}

// export function renderMap() {
//     let rows = board.length
//     let cols = board[0].length 
// }

// Automatically start rendering on script load - TODO CHANGE THIS!
renderLoop()