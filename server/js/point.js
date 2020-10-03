const config = require('./constants.js')


class Point {
    constructor(x=0, y=0, sx=0, sy=0) {
        let globalForm = (arguments.length == 2) // Whether the given coordinates are overall x/y values, or false if row/col & sub row/sub col coordinates

        this.x = globalForm ? x : x * config.SUBGRID_SIZE
        this.y = globalForm ? y : y * config.SUBGRID_SIZE

        this.col = globalForm ? Math.floor(x / config.SUBGRID_SIZE) : x
        this.row = globalForm ? Math.floor(y / config.SUBGRID_SIZE) : y
        this.subcol = globalForm ? Math.floor(x % config.SUBGRID_SIZE) : sx
        this.subrow = globalForm ? Math.floor(y % config.SUBGRID_SIZE) : sy
    }


}

module.exports = {
    Point: Point
}
