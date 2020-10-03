const config = require('./constants.js')


class Point {
    constructor(x=null, y=null, row=null, col=null, subrow=null, subcol=null) {
        let globalForm = (row == null && col == null) // Whether the given coordinates are overall x/y values, or false if row/col & sub row/sub col coordinates

        this.x = globalForm ? x : col * config.SUBGRID_SIZE
        this.y = globalForm ? y : row * config.SUBGRID_SIZE

        this.col = globalForm ? Math.floor(x / config.SUBGRID_SIZE) : col
        this.row = globalForm ? Math.floor(y / config.SUBGRID_SIZE) : row
        this.subcol = globalForm ? Math.floor(x % config.SUBGRID_SIZE) : subcol
        this.subrow = globalForm ? Math.floor(y % config.SUBGRID_SIZE) : subrow
    }
}

module.exports = {
    Point: Point
}
