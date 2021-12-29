class GameMap {
  /**
   * Class that keeps track of the entities on the map - bullets and enemies
   * The class provides a number of functons to update th stats of these entities.
   * @param {*} map 2D array where each element is a grid on the map
   * @param {*} subgridSize Size of the sub grid that makes up one map square
   */
  constructor(mapStructure, subgridSize) {
    this.map = mapStructure

    // Size of map
    this.height = this.map.length
    this.width = this.map[0].length

    this.subgridSize = subgridSize
    this.numEnemies = 0
    this.numBullets = 0
  }

  getMapStructure() {
      let basicMap = []
      for (let r = 0; r < this.map.length; r++) {
          basicMap.push([])
          for (let c = 0; c < this.map[r].length; c++) {
              basicMap[r].push({
                  "value": this.map[r][c]["value"],
                  "adjacentPathDirs": this.map[r][c]["adjacentPathDirs"]
              })
          }
      }
      return basicMap
  }

  setPaths(path, mainPath) {
    this.path = path
    this.mainPath = mainPath
  }

  setGridValue(row, col, value) {
    this.map[row][col]["value"] = value
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
    this.numBullets += 1
    this.map[bullet.position.row][bullet.position.col].bullets.push(bullet)
  }

  // Add to front of list
  addNewEnemy(enemy) {
    this.numEnemies += 1
    this.map[enemy.row][enemy.col].enemies.unshift(enemy)
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
        this.numBullets -= 1
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
        this.numEnemies -= 1
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

  // Count the number of squares in the range of a point that are on the path
  getNumberOfPathSquaresInRange(row, col, range) {
    let pathSquareCount = 0
    range = Math.floor(range)
    for (let r = Math.max(row-range, 0); r <= Math.min(this.height - 1, row+range); r += 1) {
      for (let c = Math.max(col-range, 0); c <= Math.min(this.width - 1, col+range); c += 1) {
        if (this.getGridValue(r, c) != 'x' && this.getGridValue(r, c) != 't') {
          if (Math.sqrt(Math.pow(Math.abs(row - r), 2) + Math.pow(Math.abs(col - c), 2)) <= range) {
            pathSquareCount += 1
          }
        }
      }
    }
    return pathSquareCount
  }
}


module.exports = {
  GameMap: GameMap
}
