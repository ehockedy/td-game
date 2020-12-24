/**
 * Simple class to keep both global and grid/subgrid format coordinates together, and easily use either
 */
class Point {
    /**
     * Behaviour depends on the number of arguments. If 4 - assumes local coordinates given. If just two, assumes global
     * @param {Number} subgridSize the number of sub points within a square i.e. max value of sx or sy. Used to convert between the two point systems.
     * @param {Number} x x global coordinate or column if sx and sy present
     * @param {Number} y y global coordinate or row if sx and sy present
     * @param {Number} sx sub column
     * @param {Number} sy sub row
     */
    constructor(subgridSize, x=0, y=0, sx=0, sy=0) {
        let globalForm = (arguments.length == 3) // Whether the given coordinates are overall x/y values, or false if row/col & sub row/sub col coordinates
        this.subgridSize = subgridSize

        this.x = globalForm ? x : x * this.subgridSize + sx
        this.y = globalForm ? y : y * this.subgridSize + sy

        this.col = globalForm ? Math.floor(x / this.subgridSize) : x
        this.row = globalForm ? Math.floor(y / this.subgridSize) : y
        this.subcol = globalForm ? Math.floor(x % this.subgridSize) : sx
        this.subrow = globalForm ? Math.floor(y % this.subgridSize) : sy
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

        this.col = Math.floor(x / this.subgridSize)
        this.row = Math.floor(y / this.subgridSize)
        this.subcol = Math.floor(x % this.subgridSize)
        this.subrow = Math.floor(y % this.subgridSize)
    }

    // returns a deep copy of this Point
    getCopy() {
        return new Point(this.subgridSize, this.x, this.y)
    }
}

module.exports = {
    Point: Point
}
