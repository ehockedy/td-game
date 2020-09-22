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
        this.enemies = []
        this.towers = []
        this.bullets = []
        this.map = new gameMap.GameMap(mapY, mapX, subGridXY)
        this.map.generateMap()
        this.map.printMap()
        this.map.calculatePath()
    }

    getMapStructure() {
        return this.map.map
    }

    moveEnemies() {
        this.enemies.forEach((e, idx) => {
            e.steps += e.speed
            if (e.steps < this.map.path.length) {
                e.row = this.map.path[e.steps][0]
                e.col = this.map.path[e.steps][1]
            }
            e.isHit = false // reset whether hit
        })
    }

    moveTowers() {
    // Check if an enemy is within shoot range, and turn tower if it is
        this.towers.forEach((tower) => {
            let canHit = false;
            //let enemyToShoot;
            for (let coordIdx=0; coordIdx < tower.shootRangePath.length; coordIdx++) {
                let coord = tower.shootRangePath[coordIdx]
                for (let enemyIdx=0; enemyIdx < this.enemies.length; enemyIdx++) {
                    let enemy = this.enemies[enemyIdx]
                    if (coord[0] == enemy.row && coord[1] == enemy.col) {
                        canHit = true;
                        if (tower.turns) {
                            tower.angle = calculateAngle(tower.row, tower.col, enemy.row, enemy.col) // TODO determine angle base off where enemy will be
                        }
                        let enemyFuturePos = enemy.steps+enemy.speed*5
                        if (enemyFuturePos >= this.map.path.length) break;
                        let newBullet = new bullet.Bullet(
                            [tower.row, tower.col, Math.floor(config.SUBGRID_SIZE/2), Math.floor(config.SUBGRID_SIZE/2)],
                            this.map.path[enemyFuturePos],
                            5, // dmg TODO this should be determined by type of tower, pass that through eventually
                            10, // spd TODO same as above
                            tower.range,
                            tower.name)
                        if (tower.fireTick == 0) this.bullets.push(newBullet)
                        if (this.bullets.length == 1) {
                            this.bullets[0].name = "FIRST"
                            //break;
                        }
                        break;
                    }
                }
                if (canHit) break;
            }
            tower.fireTick = (tower.fireTick + 1) % tower.rateOfFire
            if (!canHit) tower.fireTick = 0
        });
    }

    moveBullets() {
        this.bullets.forEach((bullet) => {
            bullet.move()
        })
    }

    resolveInteractions() {
        // Check all relevant game objects and see how they interact
        // Check collision between enemies and bullets
        for (let e = this.enemies.length-1; e >= 0; e--) {
            for (let b = this.bullets.length-1; b >= 0; b--) {
                if(this.bullets[b].collidesWith(
                    this.enemies[e].row*config.SUBGRID_SIZE + Math.floor(config.SUBGRID_SIZE/2), // TODO make abolute grid value a thing
                    this.enemies[e].col*config.SUBGRID_SIZE + Math.floor(config.SUBGRID_SIZE/2),
                    Math.floor(config.SUBGRID_SIZE/2))) {
                    this.enemies[e].isHit = true
                    this.enemies[e].hp -= this.bullets[b].damage
                    this.bullets.splice(b, 1) // Remove that bullet
                }
                //if (bullets[b].name == "FIRST") console.log(dist, "\n")
            }
        }

        // Check if enemy reached end of path
        for (let i = this.enemies.length-1; i >= 0; i--) {
            if (this.enemies[i].steps > this.map.path.length - this.map.subGridSize/2) {
                this.enemies.splice(i, 1) // Remove that enemy
            }
        }

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
            if (Math.random() < 0.95) return; //0.95) return;
        }

        let speedRangeMin = 1
        let speedRangeMax = 4
        // TODO create enemy types
        let randomSpeed = Math.floor(Math.random() * (speedRangeMax - speedRangeMin)) + speedRangeMin;
        this.enemies.push(new enemy.Enemy(10, randomSpeed))
        //counter++
    }

    addTower(name, type, player, row, col) {
        let newTower = new tower.Tower(name, type, player, row, col)
        console.log(this.map.mainPath)
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
        this.enemies.forEach((e, idx) => {
            state["enemies"]["objects"].push({
                "name": e.name,
                "pathPos": this.map.path[e.steps],
                "isHit": e.isHit
            })
            hash.update(e.name)
        })
        state["enemies"]["hash"] = hash.digest("hex")

        hash = crypto.createHash("sha256")
        this.towers.forEach((t, idx) => {
            state["towers"]["objects"].push({
                "name": t.name,
                "angle": t.angle,
                "posRowCol": [t.row, t.col],
                "owner": t.player
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
