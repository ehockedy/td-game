const config = require('./constants.js')
const crypto = require('crypto');
const enemy = require("./enemies.js");
const gameMap = require('./map.js');
const playerImport = require('./player.js')
const towerImport = require("./tower.js");
const point = require('./point.js');
const seedrandom = require('seedrandom');
const fs = require('fs');

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
        this.players = []
        this.map = new gameMap.GameMap(mapY, mapX, subGridXY)
        this.generateMap()

        this.hasStarted = false
        this.level = 0
        this.lives = 100
        this.enemyQueue = []
        this.enemyCount = 0
        this.enemyCountTarget = 0
    }

    getMapStructure() {
        let basicMap = []
        for (let r = 0; r < this.map.map.length; r++) {
            basicMap.push([])
            for (let c = 0; c < this.map.map[r].length; c++) {
                basicMap[r].push({
                    "value": this.map.map[r][c]["value"]
                })
            }
        }
        return basicMap
    }

    generateMap(seed="") {
        let newSeed = Math.random().toString()
        if (seed != "") newSeed = seed
        seedrandom(newSeed, { global: true }); // globally - i.e. all further calls to Math.random()
        this.seed = newSeed

        this.map.init()
        this.map.generateMap()
        //this.map.printMap()
        this.map.calculatePath()
    }

    moveEnemies() {
        // Enemies only ever appear on the path, so iterate over those squares only to find enemies
        // Iterate backwards so that we do not double move enemies that move to the next square on the path
        let prevEnemySteps = -1 // TODO can set to total path length (number of steps)+1 and remove the >0 check below
        this.map.forEachEnemyInReverse((enemy) => {
            let startPos = enemy.position
            enemy.step()
            if (enemy.row != startPos.row || enemy.col != startPos.col) {
                this.map.removeEnemyFromSquare(enemy, startPos.row, startPos.col)
                this.map.addEnemy(enemy)
            } else if (prevEnemySteps > 0 && prevEnemySteps < enemy.steps) { // May have overtaken within the same square
                this.map.removeEnemy(enemy)
                this.map.addEnemy(enemy)
            }
            enemy.isHit = false
            prevEnemySteps = enemy.steps
        })
    }

    moveTowers() {
        for (let t = 0; t < this.towers.length; t++) {
            let tower = this.towers[t]

            // Get a enemy to shoot at based on tower behaviour
            let chosenEnemy = null
            if (tower.state.aimBehaviour == "first") { // Tower aims to the enemy furthest down the path
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
                this.map.addBullet(bullet)
            })
        }
    }

    moveBullets() {
        // Move first, so don't double move, but keep track of what needs to be re-added
        let toAdd = []
        this.map.forEachBulletInReverse((bullet) => {
            bullet.move()
            if (bullet.isOffMap()) {
                this.map.removeBulletPrevPos(bullet) // Remove that bullet, and do not re-add it - it's off the map
            } else if (bullet.isOutOfRange()) {
                this.map.removeBulletPrevPos(bullet)
            } else if (bullet.hasMovedSquare) {
                this.map.removeBulletPrevPos(bullet)
                toAdd.push(bullet)
            }

            // Do not display a bullet that is still "within" the tower
            bullet.visible = !bullet.isWithinTowerInitialRange()
        })

        // Add the bullets to their new square
        toAdd.forEach((bullet) => {
            this.map.addBullet(bullet)
        })
    }

    removeEnemy(enemy) {
        this.map.removeEnemy(enemy)
        this.enemyCount += 1
    }

    processEndOfPathEnemy(enemy) {
        this.lives -= 1 // TODO dependent on enemy type?
        this.removeEnemy(enemy)
    }

    resolveInteractions() {
        // Check all relevant game objects and see how they interact
        // Check collision between enemies and bullets
        this.map.forEachEnemyInReverse((enemy) => { // TODO forEachEnemyAndBullet
            let bullets = this.map.map[enemy.position.row][enemy.position.col].bullets
            for (let bIdx = bullets.length-1; bIdx >= 0; bIdx--) {
                let bullet = bullets[bIdx]
                if(bullet.collidesWith(enemy.position, config.DEFAULT_HITBOX_RADIUS)) { // TODO make hitbox a property of the enemy
                    enemy.isHit = true
                    enemy.hp -= bullet.damage
                    bullets.splice(bIdx, 1) // Remove that bullet
                }

                if (enemy.hp <= 0) { // Enemy has been killed
                    this.removeEnemy(enemy)
                    bullet.originTower.registerKill()
                    break // If enemy has been killed, even if it is removed the enemy object still exiest. This can cause a double kill, so skip to next enemy
                }
            }
        })

        // Check if enemy reached end of path
        // We must iterate through the enemies in reverse, since removing one would mess up the indexing
        this.map.forEachEnemyInReverse((enemy) => {
            if (enemy.steps > this.map.path.length) {
                this.processEndOfPathEnemy(enemy)
            }
        })
    }

    /**
     * Adds an enemy based off a generation strategy
     * Strategy is something like fixed rate, random within a distribution
     * @param {String} distributionPattern pattern to generate enemies
     * @param {Number} enemyType type of enemy to add. ENEMY_TYPE.RANDOM (0) will generate a random enemy
     */
    addEnemy(distributionPattern, enemyType) {
        if (distributionPattern == "random") {
            // 10% chance to spawn new enemy
            if (Math.random() < 0.995) return; //0.95) return;
        }

        let speedRangeMin = 7
        let speedRangeMax = 8
        // TODO create enemy types
        let randomSpeed = Math.floor(Math.random() * (speedRangeMax - speedRangeMin)) + speedRangeMin;
        this.map.addNewEnemy(new enemy.Enemy(30, randomSpeed, this.map.path))
    }

    shiftEnemyQueue() {
        if (this.enemyQueue.length > 0) {
            if (this.enemyQueue[0].stepsUntilGo == 0) {
                this.addEnemy("", ENEMY_TYPE.RANDOM)
                this.enemyQueue.shift()
                //this.addEnemy(this.enemyQueue.shift())
            } else {
                this.enemyQueue[0].stepsUntilGo -= 1
            }
        }
    }

    addTower(name, type, playerID, row, col) {
        try {
            let newPlayer = this.getPlayerByName(playerID)
            let newTower = new towerImport.Tower(name, type, newPlayer, new point.Point(col, row, config.SUBGRID_MIDPOINT, config.SUBGRID_MIDPOINT))
            newTower.calculateShootPath(this.map.mainPath)
            this.towers.push(newTower)
        } catch (exception) {
            console.log("Tower was unable to be added - player", playerID, "not found")
        }
    }

    addPlayer(playerID) {
        let newPlayer = new playerImport.Player(playerID, this.players.length)
        this.players.push(newPlayer)
    }

    getPlayerByName(playerID) {
        for (let playerIdx=0; playerIdx < this.players.length; playerIdx+=1) {
            if (this.players[playerIdx].id == playerID) {
                return this.players[playerIdx]
            }
        }
        throw new Error("Player " + playerID + " not found")
    }

    getPlayerInfo(playerID) {
        try {
            let requestedPlayer = this.getPlayerByName(playerID)
            return {
                "playerID": requestedPlayer.id,
                "index": requestedPlayer.index
            }
        } catch (exception) {
            return {}
        }
    }

    playerExists(playerID) {
        let exists = false
        this.forEachPlayer((player)=>{
            if (player.id == playerID) exists = true
        })
        return exists
    }

    forEachPlayer(callback) {
        this.players.forEach((player) => {
            callback(player)
        })
    }

    updateTower(name, update) {
        this.towers.forEach((tower) => {
            if (tower.name == name) {
                tower.update(update)
            }
        })
    }

    ready() {
        return this.players.every((player) => player.isReady())
    }

    advanceLevel() {
        if (this.roundActive()) return // This should not occur

        this.level += 1

        // Generate the enemy queue
        this.enemyQueue = []
        for (let i=0; i < 3; i+=1) {
            this.enemyQueue.push({
                "stepsUntilGo": 40*Math.floor(Math.random()*10 + 1),
                "type": "TODO"
            })
        }

        // This is how we determine if the round is over - this many enemies have been killed or got to end
        this.enemyCountTarget = this.enemyQueue.length
        this.enemyCount = 0

        // Reset players ready status
        this.players.forEach((player) => {
            player.unsetReady()
        })
    }

    getNextRoundInfo() {
        return {
            "roundNumber": this.level+1
        }
    }

    roundActive() {
        return this.enemyCount < this.enemyCountTarget
    }

    updateActiveGameState() {
        // Update the state of existing enemies
        this.moveEnemies();

        // Move any bullets
        this.moveBullets();

        // Decide which enemy the ower aims at (if any) and shoot
        this.moveTowers();

        // See if enemy reached end, bullet hit, etc.
        this.resolveInteractions();

        // Fopr the current level, determine whether to send another enemy
        this.shiftEnemyQueue();
    }

    // Game state updates when not in a round
    updateInactiveGameState() {
        // Move any bullets - this lets any remaining bullets finish their movement
        this.moveBullets();

        this.resolveInteractions();
    }

    getGameState() {
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
            },
            "players": {
                "objects": []
            },
            "worldState" : {
                "lives": this.lives
            }
        }

        let hash = crypto.createHash("sha256")
        this.map.forEachEnemy((e) => {
            state["enemies"]["objects"].push({
                "name": e.name,
                "position": e.position,
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
                "position": t.position,
                "playerID": t.player.id,
                "type": t.type,
                "stats": t.stats
            })
            hash.update(t.name)
        })
        state["towers"]["hash"] = hash.digest("hex")

        this.map.forEachBullet((b) => {
            if (b.visible) {
                state["bullets"]["objects"].push({
                    "name": b.name,
                    "position": b.position
                })
            }
        })

        this.players.forEach((player) => {
            state["players"]["objects"].push({
                "playerID": player.id,
                "index": player.index,
                "stats": player.stats
            })
        })

        return state;
    }

    start() {
        this.hasStarted = true
    }

    exportGame() {
        let toWrite = {
            "seed": this.seed,
            "towers": []
        }
        this.towers.forEach((tower) => {
            toWrite.towers.push(tower)
        })

        fs.writeFile("backups/backup.json", JSON.stringify(toWrite), (err) => {
            if (err) throw err;
            console.log("Game data backed up");
        })
    }

    importGame() {
        return new Promise((resolve, reject) => {
            fs.readFile("backups/backup.json", (err, data) => {
                if (err) reject(err);
                console.log("Imported most recently saved game");
                let gameStateJson = JSON.parse(data)

                this.generateMap(gameStateJson.seed)

                gameStateJson.towers.forEach((tower)=>{
                    this.map.setGridValue(tower.row, tower.col, data.value, "tower")
                    this.addTower(tower.name, tower.type, this.players[0].id, tower.row, tower.col)
                })

                resolve()
            })
        })
    }
}

function setUpGame(mapX, mapY, subGridXY) {
    return new Game(mapX, mapY, subGridXY)
}

module.exports = {
    setUpGame,
    Game: Game
}
