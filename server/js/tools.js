const config = require('./constants.js')

/**
 * Converts grid coordinates to global coordinates of the whole map
 * @param {Array[4]} gridCoordinates [grid row, grid col, subgrid row, subgrid col]
 */
function localToGlobal(gridCoordinates) {  // TODO should add Point class(es)
    return [
        gridCoordinates[1] * config.SUBGRID_SIZE + gridCoordinates[3],
        gridCoordinates[0] * config.SUBGRID_SIZE + gridCoordinates[2]
    ]
}

function globalToLocal(gridCoordinates) {
    return [
        Math.floor(gridCoordinates[1] / config.SUBGRID_SIZE),
        Math.floor(gridCoordinates[0] / config.SUBGRID_SIZE),
        Math.floor(gridCoordinates[1] % config.SUBGRID_SIZE),
        Math.floor(gridCoordinates[0] % config.SUBGRID_SIZE),
    ]
}

module.exports = {
    localToGlobal,
    globalToLocal
}