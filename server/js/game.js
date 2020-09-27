const enemy = require("./enemies.js");
const tower = require("./tower.js");
const bullet = require("./bullet.js");
const gameMap = require('./map.js');
const config = require('./constants.js')
const crypto = require('crypto');

const ENEMY_TYPE = {
    RANDOM: 0,
    RED: 1,
    _MAX: 2
}

const TOWER_TYPE = {
    BLUE: 0 // Single shot basic tower
}

function calculateAngle(row1, col1, row2, col2) {
    return Math.atan2((row2-row1), (col2-col1))
}

class Game {
    constructor(mapX, mapY, subGridXY) {
        this.towers = []
        this.bullets = []
        this.map = new gameMap.GameMap(mapY, mapX, subGridXY)
        this.map.printMap()

        this.map.generateMap()
        this.map.printMap()
        this.map.calculatePath()
    }

    getMapStructure() {
        return this.map.map
    }

    moveEnemies() {
        // Enemies only every appear on the path, so iterate over those squares only to find enemies
        this.map.mainPath.forEach((rc) => {
            let enemies = this.map.map[rc[0]][rc[1]].enemies
            for (let eIdx = enemies.length-1; eIdx >= 0; eIdx--) {
                let e = enemies[eIdx]
                e.steps += e.speed
                if (e.steps < this.map.path.length) {
                    e.row = this.map.path[e.steps][0]
                    e.col = this.map.path[e.steps][1]
                }
                e.isHit = false // reset whether hit
                if (e.row != rc[0] || e.col != rc[1]) { // Check if enemy has moved into new main grid square
                    this.map.map[rc[0]][rc[1]].enemies.splice(eIdx, 1)
                    this.map.addEnemy(e) // Add to new square
                }
                this.map.reorderEnemies(rc[0], rc[1])
            }
        })
    }

    moveTowers() {
        for (let t = 0; t < this.towers.length; t++) {
            let tower = this.towers[t]

            // Get a enemy to shoot at based on tower behaviour
            let chosenEnemy = null
            if (tower.aimBehaviour == "last") { // Tower aims to the enemy furthest down the path
                for (let i = tower.shootRangePath.length-1; i >= 0; i--) {
                    let square = tower.shootRangePath[i]
                    let enemies = this.map.getEnemies(square[0], square[1])
                    if (enemies.length > 0) {
                        chosenEnemy = enemies[enemies.length-1]
                        break;
                    }
                }
            } else { // TODO if (tower.behaviour == "first") { // Tower aims at enemy earliest in the path
                for (let i = 0; i < tower.shootRangePath.length; i++) {
                    let square = tower.shootRangePath[i]
                    let enemies = this.map.getEnemies(square[0], square[1])
                    if (enemies.length > 0) {
                        chosenEnemy = enemies[0]
                        break;
                    }
                }
            }

            if (chosenEnemy == null) { // No enemy to in range
                tower.fireTick = 0 // Stop firing tick counter
                continue
            }

            // Aim and shoot if appropriate
            let enemyFuturePos = chosenEnemy.steps+chosenEnemy.speed*5 // Estimated future position of target TODO improve this
            if (enemyFuturePos >= this.map.path.length) break;
            if (tower.turns) tower.angle = calculateAngle(tower.row, tower.col, chosenEnemy.row, chosenEnemy.col) // TODO determine angle base off where enemy will be
            if (tower.fireTick == 0) this.bullets.push(new bullet.Bullet(
                [tower.row, tower.col, Math.floor(config.SUBGRID_SIZE/2), Math.floor(config.SUBGRID_SIZE/2)],
                this.map.path[enemyFuturePos],
                5, // dmg TODO this should be determined by type of tower, pass that through eventually
                3, // spd TODO same as above
                tower.range,
                tower.name)
            )
            tower.fireTick = (tower.fireTick + 1) % tower.rateOfFire
        }
    }

    moveBullets() {
        this.bullets.forEach((bullet) => {
            bullet.move()
        })
    }

    resolveInteractions() {
        // Check all relevant game objects and see how they interact
        // Check collision between enemies and bullets
        this.map.mainPath.forEach((rc) => {
            this.map.map[rc[0]][rc[1]].enemies.forEach((enemy) => {
                for (let b = this.bullets.length-1; b >= 0; b--) {
                    if(this.bullets[b].collidesWith(
                        enemy.row*config.SUBGRID_SIZE + Math.floor(config.SUBGRID_SIZE/2), // TODO make abolute grid value a thing
                        enemy.col*config.SUBGRID_SIZE + Math.floor(config.SUBGRID_SIZE/2),
                        Math.floor(config.SUBGRID_SIZE/2))) {
                        enemy.isHit = true
                        enemy.hp -= this.bullets[b].damage
                        this.bullets.splice(b, 1) // Remove that bullet
                    }
                }
            })
        })

        // Check if enemy reached end of path
        this.map.mainPath.forEach((rc) => {
            for (let i = this.map.map[rc[0]][rc[1]].enemies.length-1; i >= 0; i--) {
                let enemy = this.map.map[rc[0]][rc[1]].enemies[i]
                if (enemy.steps > this.map.path.length - this.map.subGridSize/2) {
                    this.map.getEnemies(rc[0], rc[1]).splice(i, 1) // Remove that enemy
                }
            }
        })

        for (let i = this.bullets.length-1; i >= 0; i--) {
            if (Math.sqrt(
                    Math.pow(this.bullets[i].bulletPos[0] - this.bullets[i].bulletPosStart[0], 2) +
                    Math.pow(this.bullets[i].bulletPos[1] - this.bullets[i].bulletPosStart[1], 2)
                ) > this.bullets[i].range) {
                this.bullets.splice(i, 1) // Remove that bullet
            }
        }
    }

    /**
     * Adds an enemy based off a generation strategy
     * Strategy is something like fixed rate, random within a distribution
     * @param {String} distributionPattern pattern to generate enemies
     * @param {Number} enemyType type of enemy to add. ENEMY_TYPE.RANDOM (0) will generate a random enemy
     */
    addEnemy(distributionPattern, enemyType) {
        //if (this.counter > 30) return;
        if (distributionPattern == "random") {
            // 10% chance to spawn new enemy
            if (Math.random() < 0.99) return; //0.95) return;
        }

        let speedRangeMin = 1
        let speedRangeMax = 4
        // TODO create enemy types
        let randomSpeed = Math.floor(Math.random() * (speedRangeMax - speedRangeMin)) + speedRangeMin;
        this.map.addNewEnemy(new enemy.Enemy(10, randomSpeed))
    }

    addTower(name, type, player, row, col) {
        let newTower = new tower.Tower(name, type, player, row, col)
        newTower.calculateShootPath(this.map.mainPath)
        this.towers.push(newTower)
    }

    updateGameState() {
        // Update the state of existing enemies
        this.moveEnemies();

        // Move any bullets
        this.moveBullets();

        // Decide which enemy the ower aims at (if any) and shoot
        this.moveTowers();

        // See if enemy reached end, bullet hit, etc.
        this.resolveInteractions();

        // Add random enemy with a random distribution
        this.addEnemy("random", ENEMY_TYPE.RANDOM);

        // Write the updated state
        let state = {
            "enemies" : {
                "hash": "",
                "objects": []
            },
            "towers" : {
                "hash": "",
                "objects": []
            },
            "bullets" : {
                "objects": []
            }
        }

        let hash = crypto.createHash("sha256")
        this.map.mainPath.forEach((rc) => {
            this.map.map[rc[0]][rc[1]].enemies.forEach((e) => {
                state["enemies"]["objects"].push({
                    "name": e.name,
                    "pathPos": this.map.path[e.steps],
                    "isHit": e.isHit
                })
                hash.update(e.name)
            })
        })
        state["enemies"]["hash"] = hash.digest("hex")

        hash = crypto.createHash("sha256")
        this.towers.forEach((t, idx) => {
            state["towers"]["objects"].push({
                "name": t.name,
                "angle": t.angle,
                "posRowCol": [t.row, t.col],
                "owner": t.player,
                "type": t.type
            })
            hash.update(t.name)
        })
        state["towers"]["hash"] = hash.digest("hex")

        this.bullets.forEach((b) => {
            state["bullets"]["objects"].push({
                "name": b.name,
                "bulletPos": b.bulletPos
            })
        })

        return state;
    }
}

function setUpGame(mapX, mapY, subGridXY) {
    return new Game(mapX, mapY, subGridXY)
}

module.exports = {
    setUpGame,
    Game: Game
}
