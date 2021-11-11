const gameMap = require('./map.js');
const point = require('./point.js');
const seedrandom = require('seedrandom');

// Helper functions
function mod(a, x) {
  // JS % is actually remainder function, so implement own modulus function
  return a - (x * Math.floor(a/x));
}

class MapGenerator {
    constructor(rows, cols, subgridSize) {
        // Size of map
        this.height = rows
        this.width = cols
        this.subgridSize = subgridSize
    }

    /**
     * Reset to an empty 2d array that represents the grid used in the game
     */
    resetGrid() {
        // First square on the path
        this.row_start = Math.floor(1 * this.height / 4)
        if (this.row_start % 2 == 1) this.row_start -= 1  // ensure is even

        this.col_start = 0

        // The current position whilst generating the map
        this.row = this.row_start
        this.col = this.col_start

        this.finalRow = Math.floor(3 * this.height / 4)
        if (this.finalRow % 2 == 1) this.finalRow -= 1  // ensure is even

        this.map = []
        for (var i = 0; i < this.height; i++) {
            this.map.push([])
            for (var j = 0; j < this.width; j++) {
                this.map[i].push({
                    "value": "x",  // TODO have a type entry, since paths and non-paths have distinctly different entries
                    "enemies": [],
                    "bullets": [],
                    "tower": null
                })
            }
        }

        // Record the moves take so can backtrace if get stuck
        this.move_history = []

        this.path = [] // Exact path through the sub grids that the enemeis will take
        this.mainPath = [] // Main map grid squares that the enemy path goes through
    }

    /**
     * Returns list of all the different places the path can move to
     * Move has the form [<direction>, <distance>]
     * Direction can be 'l', 'r', 'u', 'd' which stand for left, right, up, down
     * Distance is integer determined by the min/max values below
     */
    getValidDirs() {
        var moves = []
        var min_dist = 2 // Min distance to travel in one move
        var max_dist = 2 // Max distance to travel in one move

        var right_bonus = 0 // Value added to max distance moved right (so paths have a more right moving nature)
        var left_penalty = 0 // Value removed to max distance moved left (so paths don't go too far back on themselves)

        if (this.col == this.width - 1) { // In the final column, so move one to the right and finish
            if (this.row == this.finalRow) return [['r', 1]]
            else return []
        }

        // Right moves
        var c = this.col
        while (c < this.width - 2 && c - this.col < max_dist + right_bonus) {
            c += 2  // 2 means that corners wil be on "even" squares only THis ensures any line does hot have
            // a line parallel and touching it on the next row/column - so always space for a unit next to a path
            if (this.map[this.row][c]["value"] != "x") break  // Stop if new path would hit an existing path
            if (c - this.col < min_dist) continue // Don't want too mant short paths
            moves.push(["r", c - this.col])
        }

        // Left moves
        c = this.col
        while (c > 1 && this.col - c < max_dist - left_penalty) {
            c -= 2
            if (this.map[this.row][c]["value"] != "x") break
            if (this.col - c < min_dist) continue
            moves.push(["l", this.col - c])
        }

        // Number of rows from top and bottom that won't have path
        var row_buffer = 1

        // Down moves
        var r = this.row
        while (r < this.height - 2 - row_buffer && r - this.row < max_dist) {
            r += 2
            if (this.map[r][this.col]["value"] != "x") break
            if (r - this.row < min_dist) continue
            moves.push(["d", r - this.row])
        }

        // Up moves
        r = this.row
        while (r > 1 + row_buffer && this.row - r < max_dist) {
            r -= 2
            if (this.map[r][this.col]["value"] != "x") break
            if (this.row - r < min_dist) continue
            moves.push(["u", this.row - r])
        }

        return moves
    }

    makeMove(move) {
        var dir = move[0]
        var dist = move[1]

        // The first tile might be a corner, so check if it is and write the relevant tile type number
        let prevMoves = this.move_history.length
        let prevDir = ""
        if (prevMoves) {
            let prev = this.move_history[prevMoves - 1][0]
            if (prev != dir) prevDir = prev
        }

        var xMultiplier = 0 // whether to increase or decrease coordinate value in the relevant direction
        var yMultiplier = 0
        switch (dir) {
            case "l":
                xMultiplier = -1
                break
            case "r":
                xMultiplier = 1
                break
            case "u":
                yMultiplier = -1
                break
            case "d":
                yMultiplier = 1
                break
        }

        for (var i = 0; i < dist; i++) {
            this.map[this.row][this.col]["value"] = (i == 0) ? prevDir + dir : dir
            this.col += xMultiplier
            this.row += yMultiplier
        }

        this.move_history.push(move)
    }

    undoMove(move) {
        // Given a move made on the map, take the current row/col position
        // and work back from that, setting the 1s to 0s
        var dir = move[0]
        var dist = move[1]
        var multiplier = -1
        if (dir == "l" || dir == "u") { // Reverse the directions
            multiplier = 1
        }

        for (var i = 0; i < dist; i++) {
            if (dir == "l" || dir == "r") {
                this.map[this.row][this.col]["value"] = "x"
                this.col += multiplier
            }
            if (dir == "u" || dir == "d") {
                this.map[this.row][this.col]["value"] = "x"
                this.row += multiplier
            }
        }
    }

    undoMoves(count) {
        // Undoes the last count moves
        for (var m = 1; m <= count; m++) {
            this.undoMove(this.move_history.pop())
        }
    }

    isComplete() {
        // True if in the final column the designated end row
        return this.map[this.finalRow][this.width - 1]["value"] != 'x'
    }

    evaluatePathDistribution() {
        // Reports how well the path overs each quadrant of the map
        // as well as how full the map is
        var q1 = 0
        var q2 = 0
        var q3 = 0
        var q4 = 0

        for (var r = 0; r < this.height; r++) {
            for (var c = 0; c < this.width; c++) {
                if (this.map[r][c]["value"] != "x") {
                    if (r < this.width / 2 && c < this.height / 2) q1++
                    else if (r < this.width / 2 && c >= this.height / 2) q2++
                    else if (r >= this.width / 2 && c < this.height / 2) q3++
                    else if (r >= this.width / 2 && c >= this.height / 2) q4++
                }
            }
        }
        return [q1, q2, q3, q4, q1 + q2 + q3 + q4]
    }

    printMap() {
        for (var i = 0; i < this.map.length; i++) {
            var line = ""
            for (var j = 0; j < this.map[i].length; j++) {
                line += this.map[i][j]["value"].toString() + " "
                if (this.map[i][j]["value"].length == 1) line += " "
            }
            console.log(line)
        }
        console.log("\n")
    }

    //TODO test cases:
    // - no negative numbers
    // - no duplicate coords
    // - number steps is subgridSize+1 * number of subgrids
    calculatePath() {
        // Given the map, calculate the path through the map the enemies will take
        // Splits each map grid square into a subgrid of size given by the parameter
        // Each enemy can then take steps equal to its speed to determine where it will be in the next frame

        // If even number sub grid divisions, add 1
        // If was even then path to travel through the subgrid would differ depending on direction
        if (this.subgridSize % 2 == 0) this.subgridSize++

        let midSubGridPos = Math.floor(this.subgridSize / 2)

        // Total length of path through subgrids
        let pathLen = 0
        for (var r = 0; r < this.height; r++) {
            for (var c = 0; c < this.width; c++) {
                if (this.map[r][c]["value"] != "x") pathLen++
            }
        }

        // Start of path
        // Format of a path position is [map grid y, map grid x, sub grid y, sub grid x]
        for (let i = 0; i < this.subgridSize; ++i) {
            this.path.push(new point.Point(this.subgridSize, this.col_start, this.row_start, i, midSubGridPos))
        }

        // Algorithm
        // Easily know square just come from - its the map grid of the last element in path
        // Also know that the direction and orientation of first path of current grid will be same as
        // second path of previous grid

        //console.log(this.path)
        // Iterate through all the grid squares 
        for (let gridNum = 1; gridNum < pathLen - 1; gridNum++) {
            //console.log("Path: ", this.path)

            // Get the second part of the path of the previous grid square
            let prevSquareSecondPath = this.path.slice(this.path.length - midSubGridPos)
            let psspLen = prevSquareSecondPath.length

            // Identify the direction of travel from previous grid to current
            let dirVectorPrevToCurr = [
                prevSquareSecondPath[psspLen - 1].subrow - prevSquareSecondPath[psspLen - 2].subrow,
                prevSquareSecondPath[psspLen - 1].subcol - prevSquareSecondPath[psspLen - 2].subcol
            ]

            // Get coordinates of the grid square we are calculating the path for
            let currSubGridCoord = [
                prevSquareSecondPath[psspLen - 1].row + dirVectorPrevToCurr[0],
                prevSquareSecondPath[psspLen - 1].col + dirVectorPrevToCurr[1]
            ]

            // Add the first part of the path through the current grid square based
            // on the second part of the path through the previous grid square.
            // dirVectorPrevToCurr determines whether to apply the transformation - only
            // want to shift in the direction of the path
            // Then use the modulus operator to shift the positions to the "other" side
            // of the square
            // For example:
            // 0 0 0 0 0    0 0 0 0 0
            // 0 0 0 0 0    0 0 0 0 0
            // a b c d e    d e f 0 0
            // 0 0 0 0 0    0 0 g 0 0
            // 0 0 0 0 0    0 0 h 0 0
            // Direction changes happed on the middle of the subgrid (c or f) - so we know that the
            // end of the previous squares path (d e) continues into the start of the current subgrid
            //console.log("prevSquareSecondPath: ", prevSquareSecondPath)
            prevSquareSecondPath.forEach((value, index) => {
                let newSquareFirstPath = new point.Point(this.subgridSize,
                    currSubGridCoord[1], // Column of current subgrid
                    currSubGridCoord[0], // Row of current subgrid
                    mod((value.subcol + midSubGridPos * dirVectorPrevToCurr[1]), (this.subgridSize)),  // Column within current subgrid
                    mod((value.subrow + midSubGridPos * dirVectorPrevToCurr[0]), (this.subgridSize)) // Row within current subgrid
                )
                this.path.push(newSquareFirstPath)
                //console.log("newSquareFirstPath: ", newSquareFirstPath)
            })

            // Add the center subgrid position
            this.path.push(new point.Point(this.subgridSize,
                currSubGridCoord[1],
                currSubGridCoord[0],
                midSubGridPos,
                midSubGridPos
            ))

            // Get coordinates of the grid square we are moving from
            let prevSubGridCoord = [
                prevSquareSecondPath[psspLen - 1].row,
                prevSquareSecondPath[psspLen - 1].col
            ]

            // Identify direction from current subgrid to next subgrid
            let nextSubGridCoord
            for (let r = -1; r <= 1; r++) {
                for (let c = -1; c <= 1; c++) {
                    if (Math.abs(r) == Math.abs(c)) continue; // Only want horizontally and vertically adjacent squares
                    //console.log("next grid search: ",currSubGridCoord[0]+r, currSubGridCoord[1]+c)
                    //console.log("   ", this.map[currSubGridCoord[0]+r][currSubGridCoord[1]+c], prevSubGridCoord[0], prevSubGridCoord[1])
                    if (this.map[currSubGridCoord[0] + r][currSubGridCoord[1] + c]["value"] != "x" &&
                        !(prevSubGridCoord[0] == currSubGridCoord[0] + r && prevSubGridCoord[1] == currSubGridCoord[1] + c)) {
                        nextSubGridCoord = [
                            currSubGridCoord[0] + r,
                            currSubGridCoord[1] + c
                        ]
                        //console.log("^yes")
                    }
                }
            }

            // Identify the direction of travel from current grid to next
            let dirVectorCurrToNext = [
                nextSubGridCoord[0] - currSubGridCoord[0],
                nextSubGridCoord[1] - currSubGridCoord[1]
            ]

            //console.log("dirVectorCurrToNext:" , nextSubGridCoord)

            // Write second part of path - path from current subgrid to next subgrid
            for (let nsspLen = 1; nsspLen <= midSubGridPos; nsspLen++) {
                let newSquareSecondPath = new point.Point(this.subgridSize,
                    currSubGridCoord[1],
                    currSubGridCoord[0],
                    midSubGridPos + (nsspLen * dirVectorCurrToNext[1]),
                    midSubGridPos + (nsspLen * dirVectorCurrToNext[0])
                )
                this.path.push(newSquareSecondPath)
                //console.log("newSquareSecondPath: ", newSquareSecondPath)
            }
        }

        // Add final square
        let finalSquareRow = 0
        for (let r = 0; r < this.height; r++) {
            if (this.map[r][this.width - 1]["value"] != "x") {
                finalSquareRow = r;
                break;
            }
        }
        for (let i = 0; i < this.subgridSize; ++i) {
            this.path.push(new point.Point(this.subgridSize, this.width - 1, finalSquareRow, i, midSubGridPos))
            //console.log([this.row_start, this.col_start, midSubGridPos, i])
        }

        // Generate the main squares path
        this.mainPath.push(new point.Point(this.subgridSize,
            this.path[0].col,
            this.path[0].row,
            Math.floor(this.subgridSize / 2),
            Math.floor(this.subgridSize / 2)
        )) // Main square of first sub grid square
        for (let squareIdx = 0; squareIdx < this.path.length; squareIdx++) {
            if (this.path[squareIdx].row != this.mainPath[this.mainPath.length - 1].row ||
                this.path[squareIdx].col != this.mainPath[this.mainPath.length - 1].col) {
                this.mainPath.push(new point.Point(this.subgridSize,
                    this.path[squareIdx].col,
                    this.path[squareIdx].row,
                    Math.floor(this.subgridSize / 2),
                    Math.floor(this.subgridSize / 2)
                ))
            }
        }
    }

    /**
     * @returns A GameMap object with a newly generated structure and path
     */
    generateMap(seed = "") {
        // Set up seed if given, otherwise random
        // Keep the seed regardless if it is given or not for export purposes
        let newSeed = (seed != "") ? seed : Math.random().toString()
        seedrandom(newSeed, { global: true }); // globally - i.e. all further calls to Math.random()
        this.seed = newSeed

        // Reset the current state
        this.resetGrid()

        // Produce paths until completion conditions met
        var undos = 1
        while (!this.isComplete()) {
            var valid_moves = (this.move_history.length) ? this.getValidDirs() : [['r', 1]]

            if (valid_moves.length == 0) {
                this.undoMoves(undos)
                undos++
                if (undos > this.move_history.length) undos = 0
                continue
            }

            var move = valid_moves[Math.floor(Math.random() * valid_moves.length)]
            this.makeMove(move)
        }

        // Generate a GameMap object usignt the new grid and return
        let map = new gameMap.GameMap(this.map, this.subgridSize)
        this.calculatePath()
        map.setPaths(this.path, this.mainPath)
        return map
    }

}

module.exports = {
    MapGenerator: MapGenerator
}
