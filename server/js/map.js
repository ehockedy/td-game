// Helper functions
function mod(a, x) {
  // JS % is actually remainder function, so implement own modulus function
  return a - (x * Math.floor(a/x));
}

class GameMap {
  constructor(rows, cols, subGridSize) {
    // Size of map
    this.height = rows
    this.width = cols

    // Size of the sub grid that makes up one map square
    this.subGridSize = subGridSize

    // Current position for drawing map
    this.row = Math.floor(Math.random() * this.height/2) + Math.floor(this.height/4);
    this.col = 0

    this.row_start = this.row
    this.col_start = this.col

    // Recored the moves take so can backtrace if get stuck
    this.move_history = []

    // initialise board
    this.map = [] //new Array(this.height); // Make rows
    for(var i=0; i < rows; i++) {
      this.map.push([])
      for(var j=0; j < cols; j++) {
        this.map[i].push({
          "value": 0,
          "enemies": [],
          "bullets": [],
          "towers": null
        }) // Make columns
      }
    }

    // Set starting square to 1, and move one to the left do we don't straddle the first column
    this.map[this.row][this.col] = {
      "value": 1,
      "enemies": [],
      "bullets": [],
      "towers": null
    }
    this.col++
    this.map[this.row][this.col] = {
      "value": 1,
      "enemies": [],
      "bullets": [],
      "towers": null
    }

    this.path = [] // Exact path through the sub grids that the enemeis will take
    this.mainPath = [] // Main map grid squares that the enemy path goes through

    this.numEnemies = 0
  }

  setGridValue(row, col, value, property) {
    this.map[row][col][property] = value
  }

  onMainPath(row, col) {
    let onPath = false
    this.mainPath.forEach((rc) => {
      if (row == rc[0] && col == rc[1]) onPath = true
    })
    return onPath
  }

  getEnemies(row, col) {
    return this.map[row][col].enemies
  }

  // Add to front of list
  addNewEnemy(enemy) {
    this.numEnemies++
    this.map[this.row_start][this.col_start].enemies.unshift(enemy)
  }

  // Add enemy based on enemies row/column data - does not keep them in path order
  addEnemy(enemy) {
    if (this.onMainPath(enemy.row, enemy.col)) {
      this.map[enemy.row][enemy.col].enemies.push(enemy)
    }
  }

  reorderEnemies(row, col) {
    if (!this.onMainPath(row, col)) return
    this.map[row][col].enemies.sort((a, b) => {return a.steps < b.steps ? -1 : 1})
  }

  // TODO move this (and others) into a MapConstructor class
  getValidDirs() {
    // Returns list of all the different places the path can move to
    // Move has the form [<direction>, <distance>]
    // Direction can be 'l', 'r', 'u', 'd' which stand for left, right, up, down
    // Distance is integer determined by the min/max values below

    var moves = []
    var min_dist = 2 // Min distance to travel in one move
    var max_dist = 4 // Min distance to travel in one move

    var right_bonus = 1 // Value added to max distance moved right (so paths have a more right moving nature)
    var left_penalty = 1 // Value removed to max distance moved left (so paths don't go too far back on themselves)

    // Right moves
    var c = this.col
    while(c < this.width-2 && c-this.col < max_dist+right_bonus) {
      c+=2  // 2 means that corners wil be on "even" squares only THis ensures any line does hot have
            // a line parallel and touching it on the next row/column - so always space for a unit next to a path
      if (this.map[this.row][c]["value"] == 1) break  // Stop if new path would hit an existing path
      if (c-this.col < min_dist) continue // Don't want too mant short paths
      moves.push( ["r",c-this.col] )
    }

    // Left moves
    c = this.col
    while(c > 1 && this.col-c < max_dist-left_penalty) {
      c-=2
      if (this.map[this.row][c]["value"] == 1) break
      if (this.col-c < min_dist) continue
      moves.push( ["l",this.col-c] )
    }

    // Number of rows from top and bottom that won't have path
    var row_buffer = 1

    // Down moves
    var r = this.row
    while(r < this.height-2-row_buffer && r-this.row < max_dist) {
      r+=2
      if (this.map[r][this.col]["value"] == 1) break
      if (r-this.row < min_dist) continue
      moves.push( ["d",r-this.row] )
    }

    // Up moves
    r = this.row
    while(r > 1+row_buffer && this.row-r < max_dist) {
      r-=2
      if (this.map[r][this.col]["value"] == 1) break
      if (this.row-r < min_dist) continue
      moves.push( ["u",this.row-r] )
    }

    return moves
  }

  makeMove(move) {
    var dir = move[0]
    var dist = move[1]
    var multiplier = 1 // whether to increase  or decrease coordinate value
    if (dir == "l" || dir == "u") { // Move "back"
      multiplier = -1
    }
    for (var i = 0; i < dist; i++) {
      if (dir == "l" || dir == "r") {
        this.col += multiplier
        this.map[this.row][this.col]["value"] = 1
      }

      if (dir == "u" || dir == "d") {
        this.row += multiplier
        this.map[this.row][this.col]["value"] = 1
      }
    }
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
        this.map[this.row][this.col]["value"] = 0
        this.col += multiplier
      }
      if (dir == "u" || dir == "d") {
        this.map[this.row][this.col]["value"] = 0
        this.row += multiplier
      }
    }
  }

  undoMoves(count) {
    // Undoes the last count moves
    for (var m=1; m <= count; m++) {
      this.undoMove(this.move_history.pop())
    }
  }

  isComplete() {
    // True if a square in the final column is 1
    var complete = false
    for (var r=0; r < this.height; r++) {
      if (this.map[r][this.width-1]["value"] == 1) {
        complete = true
      }
    }
    return complete
  }

  evaluatePathDistribution() {
    // Reports how well the path overs each quadrant of the map
    // as well as how full the map is
    var q1 = 0
    var q2 = 0
    var q3 = 0
    var q4 = 0

    for (var r=0; r < this.height; r++) {
      for (var c=0; c < this.width; c++) {
        if (this.map[r][c]["value"] == 1) {
          if (r < this.width/2 && c < this.height/2) q1++
          else if (r < this.width/2 && c >= this.height/2) q2++
          else if (r >= this.width/2 && c < this.height/2) q3++
          else if (r >= this.width/2 && c >= this.height/2) q4++
        }
      }
    }
    return [q1, q2, q3, q4, q1+q2+q3+q4]
  }

  printMap() {
    for (var i=0; i < this.map.length; i++) {
      var line = ""
      for (var j=0; j < this.map[i].length; j++) {
        line += this.map[i][j]["value"].toString() + " "
      }
      console.log(line)
    }
    console.log("\n")
  }

  generateMap() {
    var undos = 1
    while(!this.isComplete()) {
      var valid_moves = this.getValidDirs()
    
      if (valid_moves.length == 0) {
        this.undoMoves(undos)
        undos++
        if (undos > this.move_history.length) undos = 0
        continue
      }
    
      var move = valid_moves[Math.floor(Math.random() * valid_moves.length)]
      this.makeMove(move)
      this.move_history.push(move)
    }
    return this.map
  }

  //TODO test cases:
  // - no negative numbers
  // - no duplicate coords
  // - number steps is subGridSize+1 * number of subgrids
  calculatePath() {
    // Given the map, calculate the path through the map the enemies will take
    // Splits each map grid square into a subgrid of size given by the parameter
    // Each enemy can then take steps equal to its speed to determine where it will be in the next frame

    // If even number sub grid divisions, add 1
    // If was even then path to travel through the subgrid would differ depending on direction
    if (this.subGridSize % 2 == 0) this.subGridSize++

    let midSubGridPos = Math.floor(this.subGridSize/2)

    // Total length of path through subgrids
    let pathLen = 0
    for (var r=0; r < this.height; r++) {
      for (var c=0; c < this.width; c++) {
        if (this.map[r][c]["value"] == 1) pathLen++
      }
    }

    // Start of path
    // Format of a path position is [map grid y, map grid x, sub grid y, sub grid x]
    for (let i=0; i < this.subGridSize; ++i) {
      this.path.push([this.row_start, this.col_start, midSubGridPos, i])
      //console.log([this.row_start, this.col_start, midSubGridPos, i])
    }

    // Algorithm
    // Easily know square just come from - its the map grid of the last element in path
    // Also know that the direction and orientation of first path of current grid will be same as
    // second path of previous grid

    //console.log(this.path)
    // Iterate through all the grid squares 
    for (let gridNum = 1; gridNum < pathLen-1; gridNum++) {
      //console.log("Path: ", this.path)

      // Get the second part of the path of the previous grid square
      let prevSquareSecondPath = this.path.slice(this.path.length-midSubGridPos)
      let psspLen = prevSquareSecondPath.length

      // Identify the direction of travel from previous grid to current
      let dirVectorPrevToCurr = [
        prevSquareSecondPath[psspLen-1][2] - prevSquareSecondPath[psspLen-2][2],
        prevSquareSecondPath[psspLen-1][3] - prevSquareSecondPath[psspLen-2][3]
      ]

      // Get coordinates of the grid square we are calculating the path for
      let currSubGridCoord = [
        prevSquareSecondPath[psspLen-1][0] + dirVectorPrevToCurr[0],
        prevSquareSecondPath[psspLen-1][1] + dirVectorPrevToCurr[1]
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
        let newSquareFirstPath = [
          currSubGridCoord[0], // Row of current subgrid
          currSubGridCoord[1], // Column of current subgrid
          mod((value[2] + midSubGridPos*dirVectorPrevToCurr[0]), (this.subGridSize)), // Row within current subgrid
          mod((value[3] + midSubGridPos*dirVectorPrevToCurr[1]), (this.subGridSize))  // Column within current subgrid
        ]
        this.path.push(newSquareFirstPath)
        //console.log("newSquareFirstPath: ", newSquareFirstPath)
      })

      // Add the center subgrid position
      this.path.push([
        currSubGridCoord[0],
        currSubGridCoord[1],
        midSubGridPos,
        midSubGridPos
      ])

      //console.log("Path: ", this.path)


      // Get coordinates of the grid square we are moving from
      let prevSubGridCoord = [
        prevSquareSecondPath[psspLen-1][0],
        prevSquareSecondPath[psspLen-1][1]
      ]

      // Identify direction from current subgrid to next subgrid
      let nextSubGridCoord
      for (let r = -1; r <= 1; r++) {
        for (let c = -1; c <= 1; c++) {
          if (Math.abs(r) == Math.abs(c)) continue; // Only want horizontally and vertically adjacent squares
          //console.log("next grid search: ",currSubGridCoord[0]+r, currSubGridCoord[1]+c)
          //console.log("   ", this.map[currSubGridCoord[0]+r][currSubGridCoord[1]+c], prevSubGridCoord[0], prevSubGridCoord[1])
          if (this.map[currSubGridCoord[0]+r][currSubGridCoord[1]+c]["value"] == 1 &&
              !(prevSubGridCoord[0] == currSubGridCoord[0]+r && prevSubGridCoord[1] == currSubGridCoord[1]+c) ) {
            nextSubGridCoord = [
              currSubGridCoord[0]+r,
              currSubGridCoord[1]+c
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
        let newSquareSecondPath = [
          currSubGridCoord[0],
          currSubGridCoord[1],
          midSubGridPos + (nsspLen*dirVectorCurrToNext[0]),
          midSubGridPos + (nsspLen*dirVectorCurrToNext[1])
        ]
        this.path.push(newSquareSecondPath)
        //console.log("newSquareSecondPath: ", newSquareSecondPath)
      } 
    }
    
    // Add final square
    let finalSquareRow = 0
    for (let r=0; r < this.height; r++) {
      if (this.map[r][this.width-1]["value"] == 1) {
        finalSquareRow = r;
        break;
      }
    }
    for (let i=0; i < this.subGridSize; ++i) {
      this.path.push([finalSquareRow, this.width-1, midSubGridPos, i])
      //console.log([this.row_start, this.col_start, midSubGridPos, i])
    }

    console.log("Path: ", this.path)

    // Generate the main squares path
    this.mainPath.push([
      this.path[0][0],
      this.path[0][1]
    ]) // Main square of first sub grid square
    for (let squareIdx=0; squareIdx < this.path.length; squareIdx++) {
      if (this.path[squareIdx][0] != this.mainPath[this.mainPath.length-1][0] ||
          this.path[squareIdx][1] != this.mainPath[this.mainPath.length-1][1]) {
            this.mainPath.push([
              this.path[squareIdx][0],
              this.path[squareIdx][1]
            ])
      }
    }
    console.log("Main path: ", this.mainPath)

  }

}


module.exports = {
  GameMap: GameMap
}
