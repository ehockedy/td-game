const config = require('./constants.js')
const crypto = require('crypto');
const enemy = require("./enemies.js");
const gameMap = require('./map.js');
const tools = require('./tools.js')
const towerImport = require("./tower.js");
const point = require('./point.js');

const ENEMY_TYPE = {
    RANDOM: 0,
    RED: 1,
    _MAX: 2
}

const TOWER_TYPE = {
    BLUE: 0 // Single shot basic tower
}


class Game {
    constructor(mapX, mapY, subGridXY) {
        this.towers = []
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
        // Enemies only ever appear on the path, so iterate over those squares only to find enemies
        // Iterate backwards so what we do not double move enemies that move to the next square on the path
        this.map.forEachEnemyInReverse((enemy) => {
            let startPos = enemy.position
            enemy.step()
            if (enemy.row != startPos.row || enemy.col != startPos.col) {
                this.map.removeEnemyFromSquare(enemy, startPos.row, startPos.col)
                this.map.addEnemy(enemy)
            }
            enemy.isHit = false
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
                    let enemies = this.map.getEnemies(square.row, square.col)
                    if (enemies.length > 0) {
                        chosenEnemy = enemies[enemies.length-1]
                        break;
                    }
                }
            } else { // TODO if (tower.behaviour == "first") { // Tower aims at enemy earliest in the path
                for (let i = 0; i < tower.shootRangePath.length; i++) {
                    let square = tower.shootRangePath[i]
                    let enemies = this.map.getEnemies(square.row, square.col)
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

            tower.setTarget(chosenEnemy)
            tower.shoot().forEach((bullet) => {
                this.map.map[tower.row][tower.col].bullets.push(bullet)
            })

            tower.fireTick = (tower.fireTick + 1) % tower.rateOfFire
        }
    }

    moveBullets() {
        // Move the bullets
        this.map.map.forEach((r) => {
            r.forEach((c) => {
                c.bullets.forEach((bullet) => {
                    bullet.move()
                })
            })
        })

        // Then update the squares they exist in TODO this could be neater, and probably not most efficient way
        this.map.map.forEach((r, rIdx) => {
            r.forEach((c, cIdx) => {
                let bullets = c.bullets
                for (let bIdx = bullets.length-1; bIdx >= 0; bIdx--) {
                    let bullet = bullets[bIdx]
                    if (bullet.isOffMap()) bullets.splice(bIdx, 1) // Remove that bullet, and do not re-add it - it's off the map
                    else if (bullet.position.row != rIdx || bullet.position.col != cIdx) {
                        this.map.map[bullet.position.row][bullet.position.col].bullets.push(bullet)
                        bullets.splice(bIdx, 1) // Remove that bullet
                    }
                }
            })
        })

    }

    resolveInteractions() {
        // Check all relevant game objects and see how they interact
        // Check collision between enemies and bullets
        this.map.forEachEnemy((enemy) => {
            let bullets = this.map.map[enemy.position.row][enemy.position.col].bullets
            for (let bIdx = bullets.length-1; bIdx >= 0; bIdx--) {
                let bullet = bullets[bIdx]
                if(bullet.collidesWith(enemy.position, config.DEFAULT_HITBOX_RADIUS)) { // TODO make hitbox a property of the enemy
                    enemy.isHit = true
                    enemy.hp -= bullet.damage
                    bullets.splice(bIdx, 1) // Remove that bullet
                }
            }
        })

        // Check if enemy reached end of path
        // We must iterate through the enemies in reverse, since removing one would mess up the indexing
        this.map.forEachEnemyInReverse((enemy) => {
            if (enemy.steps > this.map.path.length - config.SUBGRID_MIDPOINT) {
                this.map.removeEnemy(enemy)
            }
        })

        // Check for bullets that have travelled too far without hitting an enemy
        this.map.map.forEach((r) => {
            r.forEach((c) => {
                let bullets = c.bullets
                for (let bIdx = bullets.length-1; bIdx >= 0; bIdx--) {
                    if (bullets[bIdx].isOutOfRange()) {
                       bullets.splice(bIdx, 1) // Remove that bullet
                    }
                }
            })
        })
    }

    /**
     * Adds an enemy based off a generation strategy
     * Strategy is something like fixed rate, random within a distribution
     * @param {String} distributionPattern pattern to generate enemies
     * @param {Number} enemyType type of enemy to add. ENEMY_TYPE.RANDOM (0) will generate a random enemy
     */
    addEnemy(distributionPattern, enemyType) {
        if (this.map.numEnemies < 1) {
            this.map.addNewEnemy(new enemy.Enemy(10, 1, this.map.path))
            return
        }
        //if (this.counter > 30) return;
        if (distributionPattern == "random") {
            // 10% chance to spawn new enemy
            if (Math.random() < 0.995) return; //0.95) return;
        }

        let speedRangeMin = 1
        let speedRangeMax = 3
        // TODO create enemy types
        let randomSpeed = Math.floor(Math.random() * (speedRangeMax - speedRangeMin)) + speedRangeMin;
        this.map.addNewEnemy(new enemy.Enemy(10, randomSpeed, this.map.path))
    }

    addTower(name, type, player, row, col) {
        let newTower = new towerImport.Tower(name, type, player, new point.Point(col, row, config.SUBGRID_MIDPOINT, config.SUBGRID_MIDPOINT))
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
        this.map.forEachEnemy((e) => {
            state["enemies"]["objects"].push({
                "name": e.name,
                "pathPos": [e.row, e.col, e.subrow, e.subcol],
                "isHit": e.isHit
            })
            hash.update(e.name)
        })

        state["enemies"]["hash"] = hash.digest("hex")

        hash = crypto.createHash("sha256")
        this.towers.forEach((t) => {
            state["towers"]["objects"].push({
                "name": t.name,
                "angle": t.angle,
                "posRowCol": t.position,
                "owner": t.player,
                "type": t.type
            })
            hash.update(t.name)
        })
        state["towers"]["hash"] = hash.digest("hex")

        this.map.map.forEach((r) => {
            r.forEach((c) => {
                c.bullets.forEach((b) => {
                    state["bullets"]["objects"].push({
                        "name": b.name,
                        "bulletPos": [b.position.row, b.position.col, b.position.subrow, b.position.subcol]
                    })
                })
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
