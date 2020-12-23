const fs = require('fs');
// VERY temporary measure
const config = JSON.parse(fs.readFileSync('shared/json/gameConfig.json'));

/**
 * Simple class to keep both global and grid/subgrid format coordinates together, and easily use either
 */
class Point {
    /**
     * Behaviour depends on the number of arguments. If 4 - assumes local coordinates given. If just two, assumes global
     * @param {Number} x x global coordinate or column if sx and sy present
     * @param {Number} y y global coordinate or row if sx and sy present
     * @param {Number} sx sub column
     * @param {Number} sy sub row
     */
    constructor(x=0, y=0, sx=0, sy=0) {
        let globalForm = (arguments.length == 2) // Whether the given coordinates are overall x/y values, or false if row/col & sub row/sub col coordinates

        this.x = globalForm ? x : x * config.SUBGRID_SIZE + sx
        this.y = globalForm ? y : y * config.SUBGRID_SIZE + sy

        this.col = globalForm ? Math.floor(x / config.SUBGRID_SIZE) : x
        this.row = globalForm ? Math.floor(y / config.SUBGRID_SIZE) : y
        this.subcol = globalForm ? Math.floor(x % config.SUBGRID_SIZE) : sx
        this.subrow = globalForm ? Math.floor(y % config.SUBGRID_SIZE) : sy
    }

    getPos() {
       return {
           "x": this.x,
           "y": this.y,
           "col": this.col,
           "row": this.row,
           "subrow": this.subrow,
           "subcol": this.subcol
       }
    }

    updatePosGlobal(x, y) {
        this.x = x
        this.y = y

        this.col = Math.floor(x / config.SUBGRID_SIZE)
        this.row = Math.floor(y / config.SUBGRID_SIZE)
        this.subcol = Math.floor(x % config.SUBGRID_SIZE)
        this.subrow = Math.floor(y % config.SUBGRID_SIZE)
    }
}

module.exports = {
    Point: Point
}
