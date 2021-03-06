const point = require('../js/point.js')

// Helper functions
function mod(a, x) {
  // JS % is actually remainder function, so implement own modulus function
  return a - (x * Math.floor(a/x));
}

class GameMap {
  constructor(rows, cols, subgridSize) {
    // Size of map
    this.height = rows
    this.width = cols

    // Size of the sub grid that makes up one map square
    this.subgridSize = subgridSize

    this.numEnemies = 0

    this.init()
  }

  init() {
    // Current position for drawing map
    this.row = Math.floor(Math.random() * this.height/2) + Math.floor(this.height/4);
    this.col = 0

    this.row_start = this.row
    this.col_start = this.col

    // Recored the moves take so can backtrace if get stuck
    this.move_history = []

    // initialise board
    this.map = [] //new Array(this.height); // Make rows
    for(var i=0; i < this.height; i++) {
      this.map.push([])
      for(var j=0; j < this.width; j++) {
        this.map[i].push({
          "value": "x",
          "enemies": [],
          "bullets": [],
          "tower": null
        }) // Make columns
      }
    }

    this.path = [] // Exact path through the sub grids that the enemeis will take
    this.mainPath = [] // Main map grid squares that the enemy path goes through
  }

  setGridProperty(row, col, property, value) {
    this.map[row][col][property] = value
  }

  getGridValue(row, col) {
    return this.map[row][col].value
  }

  onMainPath(row, col) {
    let onPath = false
    this.mainPath.forEach((rc) => {
      if (row == rc.row && col == rc.col) onPath = true
    })
    return onPath
  }

  getEnemies(row, col) {
    return this.map[row][col].enemies
  }

  // Add bullet based on its current position
  // No order is maintained in bullet arrays
  addBullet(bullet) {
    this.map[bullet.position.row][bullet.position.col].bullets.push(bullet)
  }

  // Add to front of list
  addNewEnemy(enemy) {
    this.numEnemies++
    this.map[this.row_start][this.col_start].enemies.unshift(enemy)
  }

  // Add enemy based on enemies row/column data and keep them in path order
  // Basic O(n) linear insertion
  addEnemy(enemy) {
    if (this.onMainPath(enemy.row, enemy.col)) {
      let enemies = this.map[enemy.row][enemy.col].enemies

      // If no current enemies or enemy is further than all current enemies, add to the end
      if (enemies.length == 0 || enemies[enemies.length-1].steps <= enemy.steps) {
        enemies.push(enemy)
      } else {
        for (let pos = 0; pos < enemies.length; pos++) {
          // Put the enemy in front of the first enemy it is earlier than
          if (enemy.steps <= enemies[pos].steps) {
            enemies.splice(pos, 0, enemy)
            break
          }
        }
      }
    }
  }

  // TODO make these Bullet/Enemy functions call generic
  removeBullet(bullet) {
    return this.removeBulletFromSquare(bullet, bullet.position.row, bullet.position.col)
  }

  // Sometimes need to use a previous position when removing a bullet
  // Might be because a consition has been realised only once moved
  removeBulletPrevPos(bullet) {
    return this.removeBulletFromSquare(bullet, bullet.positionPrev.row, bullet.positionPrev.col)
  }

  // Traverse through given square until equivalent object found
  // Unique name provides uniqueness between enemy objects
  removeBulletFromSquare(bullet, row, col) {
    let bullets = this.map[row][col].bullets
    let found = false
    for (let b = bullets.length - 1; b >= 0; b--) {
      if (bullets[b].name == bullet.name) {
        bullets.splice(b, 1)
        found = true
        break
      }
    }
    return found
  }

  removeEnemy(enemy) {
    let row = enemy.position.row
    let col = enemy.position.col
    return this.removeEnemyFromSquare(enemy, row, col)
  }

  // Traverse through given square until equivalent object found
  // Unique name provides uniqueness between enemy objects
  removeEnemyFromSquare(enemy, row, col) {
    let enemies = this.map[row][col].enemies
    let found = false
    for (let e = enemies.length - 1; e >= 0; e--) {
      if (enemies[e] == enemy) {
        enemies.splice(e, 1)
        found = true
        break
      }
    }
    return found
  }

  forEachEnemy(callback) {
    this.mainPath.forEach((rc) => { // Enemies only exist on the main path
      this.map[rc.row][rc.col].enemies.forEach((enemy) => {
          callback(enemy)
      })
    })
  }

  forEachEnemyInReverse(callback) { // Iterate through main path backwards, and go through enemies in reverse
    for (let p = this.mainPath.length-1; p >= 0; p--) {
      let rc = this.mainPath[p]
      for (let e = this.map[rc.row][rc.col].enemies.length - 1; e >= 0; e--) {
        callback(this.map[rc.row][rc.col].enemies[e])
      }
    }
  }

  forEachBullet(callback) {
    this.map.forEach((row) => {
      row.forEach((col) => {
        col.bullets.forEach((bullet) => {
          callback(bullet)
        })
      })
    })
  }

  forEachBulletInReverse(callback) { // Iterate through main path backwards, and go through enemies in reverse
    for (let row = this.map.length - 1; row >= 0; row--) {
      for (let col = this.map[row].length - 1; col >= 0; col--) {
        for (let b = this.map[row][col].bullets.length - 1; b >= 0; b--) {
          callback(this.map[row][col].bullets[b])
        }
      }
    }
  }

  // TODO move this (and others) into a MapConstructor class
  getValidDirs() {
    // Returns list of all the different places the path can move to
    // Move has the form [<direction>, <distance>]
    // Direction can be 'l', 'r', 'u', 'd' which stand for left, right, up, down
    // Distance is integer determined by the min/max values below

    var moves = []
    var min_dist = 2 // Min distance to travel in one move
    var max_dist = 2 // Max distance to travel in one move

    var right_bonus = 0 // Value added to max distance moved right (so paths have a more right moving nature)
    var left_penalty = 0 // Value removed to max distance moved left (so paths don't go too far back on themselves)

    if (this.col == this.width-1) { // In the final column, so move one to the right and finish
      return [['r', 1]]
    }

    // Right moves
    var c = this.col
    while(c < this.width-2 && c-this.col < max_dist+right_bonus) {
      c+=2  // 2 means that corners wil be on "even" squares only THis ensures any line does hot have
            // a line parallel and touching it on the next row/column - so always space for a unit next to a path
      if (this.map[this.row][c]["value"] != "x") break  // Stop if new path would hit an existing path
      if (c-this.col < min_dist) continue // Don't want too mant short paths
      moves.push( ["r",c-this.col] )
    }

    // Left moves
    c = this.col
    while(c > 1 && this.col-c < max_dist-left_penalty) {
      c-=2
      if (this.map[this.row][c]["value"] != "x") break
      if (this.col-c < min_dist) continue
      moves.push( ["l",this.col-c] )
    }

    // Number of rows from top and bottom that won't have path
    var row_buffer = 1

    // Down moves
    var r = this.row
    while(r < this.height-2-row_buffer && r-this.row < max_dist) {
      r+=2
      if (this.map[r][this.col]["value"] != "x") break
      if (r-this.row < min_dist) continue
      moves.push( ["d",r-this.row] )
    }

    // Up moves
    r = this.row
    while(r > 1+row_buffer && this.row-r < max_dist) {
      r-=2
      if (this.map[r][this.col]["value"] != "x") break
      if (this.row-r < min_dist) continue
      moves.push( ["u",this.row-r] )
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
      let prev = this.move_history[prevMoves-1][0]
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
    for (var m=1; m <= count; m++) {
      this.undoMove(this.move_history.pop())
    }
  }

  isComplete() {
    // True if a square in the final column is 1
    var complete = false
    for (var r=0; r < this.height; r++) {
      if (this.map[r][this.width-1]["value"] != "x") {
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
        if (this.map[r][c]["value"] != "x") {
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
    return this.map
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

    let midSubGridPos = Math.floor(this.subgridSize/2)

    // Total length of path through subgrids
    let pathLen = 0
    for (var r=0; r < this.height; r++) {
      for (var c=0; c < this.width; c++) {
        if (this.map[r][c]["value"] != "x") pathLen++
      }
    }

    // Start of path
    // Format of a path position is [map grid y, map grid x, sub grid y, sub grid x]
    for (let i=0; i < this.subgridSize; ++i) {
      this.path.push(new point.Point(this.subgridSize, this.col_start, this.row_start, i, midSubGridPos))
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
        prevSquareSecondPath[psspLen-1].subrow - prevSquareSecondPath[psspLen-2].subrow,
        prevSquareSecondPath[psspLen-1].subcol - prevSquareSecondPath[psspLen-2].subcol
      ]

      // Get coordinates of the grid square we are calculating the path for
      let currSubGridCoord = [
        prevSquareSecondPath[psspLen-1].row + dirVectorPrevToCurr[0],
        prevSquareSecondPath[psspLen-1].col + dirVectorPrevToCurr[1]
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
          mod((value.subcol + midSubGridPos*dirVectorPrevToCurr[1]), (this.subgridSize)),  // Column within current subgrid
          mod((value.subrow + midSubGridPos*dirVectorPrevToCurr[0]), (this.subgridSize)) // Row within current subgrid
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

      //console.log("Path: ", this.path)


      // Get coordinates of the grid square we are moving from
      let prevSubGridCoord = [
        prevSquareSecondPath[psspLen-1].row,
        prevSquareSecondPath[psspLen-1].col
      ]

      // Identify direction from current subgrid to next subgrid
      let nextSubGridCoord
      for (let r = -1; r <= 1; r++) {
        for (let c = -1; c <= 1; c++) {
          if (Math.abs(r) == Math.abs(c)) continue; // Only want horizontally and vertically adjacent squares
          //console.log("next grid search: ",currSubGridCoord[0]+r, currSubGridCoord[1]+c)
          //console.log("   ", this.map[currSubGridCoord[0]+r][currSubGridCoord[1]+c], prevSubGridCoord[0], prevSubGridCoord[1])
          if (this.map[currSubGridCoord[0]+r][currSubGridCoord[1]+c]["value"] != "x" &&
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
        let newSquareSecondPath = new point.Point(this.subgridSize,
          currSubGridCoord[1],
          currSubGridCoord[0],
          midSubGridPos + (nsspLen*dirVectorCurrToNext[1]),
          midSubGridPos + (nsspLen*dirVectorCurrToNext[0])
        )
        this.path.push(newSquareSecondPath)
        //console.log("newSquareSecondPath: ", newSquareSecondPath)
      } 
    }
    
    // Add final square
    let finalSquareRow = 0
    for (let r=0; r < this.height; r++) {
      if (this.map[r][this.width-1]["value"] != "x") {
        finalSquareRow = r;
        break;
      }
    }
    for (let i=0; i < this.subgridSize; ++i) {
      this.path.push(new point.Point(this.subgridSize, this.width-1, finalSquareRow, i, midSubGridPos))
      //console.log([this.row_start, this.col_start, midSubGridPos, i])
    }

    // Generate the main squares path
    this.mainPath.push(new point.Point(this.subgridSize,
      this.path[0].col,
      this.path[0].row,
      Math.floor(this.subgridSize/2),
      Math.floor(this.subgridSize/2)
    )) // Main square of first sub grid square
    for (let squareIdx=0; squareIdx < this.path.length; squareIdx++) {
      if (this.path[squareIdx].row != this.mainPath[this.mainPath.length-1].row ||
          this.path[squareIdx].col != this.mainPath[this.mainPath.length-1].col) {
            this.mainPath.push(new point.Point(this.subgridSize,
              this.path[squareIdx].col,
              this.path[squareIdx].row,
              Math.floor(this.subgridSize/2),
              Math.floor(this.subgridSize/2)
            ))
      }
    }
  }
}


module.exports = {
  GameMap: GameMap
}
