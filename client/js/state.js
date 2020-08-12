// State variables accessible for multiple parts of the client
// They are updated as the game goes on
var state = {}
var board
var mapWidth
var mapHeight

// Setters
function setState(new_state) {
    state = new_state
}

function setBoard(new_board) {
    board = new_board
}

/**
 * Sets the dimensions of the map. Does not actually change the map, 
 * but allows the diemnsions to be accessed by other parts of the application
 * @param {Number} rows Number of rows of the map
 * @param {Number} cols Number of columns of the map
 */
function setGridDimsRowsCols(rows, cols) {
    mapHeight = rows
    mapWidth = cols
}

// Getters
function getState() {
    return state
}

function getBoard() {
    return board
}

function getGridDimsRowsCols() {
    return [mapHeight, mapWidth]
}

export {getState, getBoard, getGridDimsRowsCols, setState, setBoard, setGridDimsRowsCols}
