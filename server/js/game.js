//const { DEFAULT_MIN_VERSION } = require("tls");
//const { maxHeaderSize } = require("http");

var state = {
  "players": [
    {
      "player1": {
        "x": 50,
        "y": 50
      }
    }
  ]
}

movePlayer = function (id, x, y) {
  state["players"][0][id]["x"] += x;
  state["players"][0][id]["y"] += y;
};

exports.updateGameState = function() {
  movePlayer("player1", 2, 2)
  return state;
}

exports.getGameState = function () {
  return state;
}


class GameMap {
  constructor(rows, cols) {
    // Size of map
    this.height = rows
    this.width = cols

    // Current position for drawing map
    this.row = Math.floor(Math.random() * this.height/2) + Math.floor(this.height/4);
    this.col = 0

    // Recored the moves take so can backtrace if get stuck
    this.move_history = []

    // initialise board
    this.map = new Array(this.height); // Make rows
    for(var i=0; i < this.map.length; i++) {
      this.map[i] = new Array(this.width).fill(0) // Make columns
    }

    // Set starting square to 1, and move one to the left do we don't straddle the first column
    this.map[this.row][this.col] = 1
    this.col++
    this.map[this.row][this.col] = 1

  }

  getValidDirs() {
    // Returns list of all the different places the path can move to
    // Move has the form [<direction>, <distance>]
    // Direction can be 'l', 'r', 'u', 'd' which stand for left, right, up, down
    // Distance is integer determined by the min/max values below

    var moves = []
    var min_dist = 2 // Min distance to travel in one move
    var max_dist = 6 // Min distance to travel in one move

    var right_bonus = 2 // Value added to max distance moved right (so paths have a more right moving nature)
    var left_penalty = 2 // Value removed to max distance moved left (so paths don't go too far back on themselves)

    // Right moves
    var c = this.col
    while(c < this.width-2 && c-this.col < max_dist+right_bonus) {
      c+=2  // 2 means that corners wil be on "even" squares only THis ensures any line does hot have
            // a line parallel and touching it on the next row/column - so always space for a unit next to a path
      if (this.map[this.row][c] == 1) break  // Stop if new path would hit an existing path
      if (c-this.col < min_dist) continue // Don't want too mant short paths
      moves.push( ["r",c-this.col] )
    }

    // Left moves
    c = this.col
    while(c > 1 && this.col-c < max_dist-left_penalty) {
      c-=2
      if (this.map[this.row][c] == 1) break
      if (this.col-c < min_dist) continue
      moves.push( ["l",this.col-c] )
    }

    // Number of rows from top and bottom that won't have path
    var row_buffer = 3

    // Down moves
    var r = this.row
    while(r < this.height-2-row_buffer && r-this.row < max_dist) {
      r+=2
      if (this.map[r][this.col] == 1) break
      if (r-this.row < min_dist) continue
      moves.push( ["d",r-this.row] )
    }

    // Up moves
    r = this.row
    while(r > 1+row_buffer && this.row-r < max_dist) {
      r-=2
      if (this.map[r][this.col] == 1) break
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
        this.map[this.row][this.col] = 1
      }
      if (dir == "u" || dir == "d") {
        this.row += multiplier
        this.map[this.row][this.col] = 1
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
        this.map[this.row][this.col] = 0
        this.col += multiplier
      }
      if (dir == "u" || dir == "d") {
        this.map[this.row][this.col] = 0
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
      if (this.map[r][this.width-1]==1) {
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
        if (this.map[r][c] == 1) {
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
        line += this.map[i][j].toString() + " "
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
  }

}

var map = new GameMap(26, 36)
map.generateMap()
map.printMap()

distribution = map.evaluatePathDistribution()
use_percent = distribution[4]/(map.width*map.height)

if ( use_percent < 0.1 ) {
  console.log("Sparse")
} else if (use_percent < 0.2) {
  console.log("Medium")
} else {
  console.log("Dense")
}


exports.GameMap
