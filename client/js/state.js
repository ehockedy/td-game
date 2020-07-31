var state = {}
var board
var enemies = []

function setState(new_state) {
    state = new_state
}

function setBoard(new_board) {
    board = new_board
}

function addEnemy(new_enemy) {
    enemies.push(new_enemy)
}

export {state, board, enemies, setState, setBoard, addEnemy}