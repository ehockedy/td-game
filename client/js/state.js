var state = {}
var board
var enemies = []

function setState(new_state) {
    state = new_state
}

function printMap() {
    for (var i=0; i < board.length; i++) {
        var line = ""
        for (var j=0; j < board[i].length; j++) {
            line += board[i][j].toString() + " "
        }
        console.log(line)
    }
    console.log("\n")
}

function setBoard(new_board) {
    board = new_board
}

function addEnemy(new_enemy) {
    enemies.push(new_enemy)
}

function getState() {
    return state
}

function getBoard() {
    return board
}

export {getState, getBoard, setState, setBoard, addEnemy, printMap}
