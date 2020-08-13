// State variables accessible for multiple parts of the client
// They may be updated as the game goes on
var state = {}
var board
var mapWidth
var mapHeight
var subGridSize // Same as height

// Setters
export function setState(new_state) {
    state = new_state
}

export function setBoard(new_board) {
    board = new_board
}

export function setSubGridDim(newSubGridSize) {
    subGridSize = newSubGridSize
}

/**
 * Sets the dimensions of the map. Does not actually change the map, 
 * but allows the diemnsions to be accessed by other parts of the application
 * @param {Number} rows Number of rows of the map
 * @param {Number} cols Number of columns of the map
 */
export function setGridDimsRowsCols(rows, cols) {
    mapHeight = rows
    mapWidth = cols
}

// Getters
export function getState() {
    return state
}

export function getBoard() {
    return board
}

export function getGridDimsRowsCols() {
    return [mapHeight, mapWidth]
}

export function getSubGridDim() {
    return subGridSize;
}
