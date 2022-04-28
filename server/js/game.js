const crypto = require('crypto');
const playerImport = require('./player.js')
const towerImport = require("./tower.js");
const point = require('./point.js');
const fs = require('fs');
const { EnemyFactory } = require('./enemies.js');


class Game {
    constructor(map, rounds, settings, enemyConfig) {
        this.map = map
        this.towers = []
        this.players = []

        this.hasStarted = false
        this.roundActive = false

        this.round = 1
        this.maxRounds = settings.numRounds
        this.rounds = rounds

        this.lives = 100

        this.subgridSize = this.map.subgridSize
        this.subgridMidpoint = Math.floor(this.subgridSize/2)
        this.ticksPerSecond = settings.ticksPerSecond

        this.enemyFactory = new EnemyFactory(enemyConfig, this.map.path, this.map.subgridSize, this.ticksPerSecond)
        this.enemyQueue = []
        this.enemyKillCount = 0
        this.enemiesRemaining = 0
        this.endOfPathEnemies = []  // Holds the enemies that have reached the end of the path without dying
    }

    moveEnemies() {
        // Enemies only ever appear on the path, so iterate over those squares only to find enemies
        // Iterate backwards so that we do not double move enemies that move to the next square on the path
        let prevEnemySteps = -1 // TODO can set to total path length (number of steps)+1 and remove the >0 check below
        this.map.forEachEnemyInReverse((enemy) => {
            // This enemy was determined to have reached the end of the path last update, so can be safely removed now
            if (enemy.hasReachedEnd) {
                this.processEndOfPathEnemy(enemy)
                return
            }

            let startPos = enemy.position
            enemy.step()
            enemy.turn(this.map.getGridValue(startPos.row, startPos.col))
            if (enemy.row != startPos.row || enemy.col != startPos.col) {
                this.map.removeEnemyFromSquare(enemy, startPos.row, startPos.col)
                this.map.addEnemy(enemy)
            } else if (prevEnemySteps > 0 && prevEnemySteps < enemy.steps) { // May have overtaken within the same square
                this.map.removeEnemy(enemy)
                this.map.addEnemy(enemy)
            }
            prevEnemySteps = enemy.steps
        })
    }

    moveTowers() {
        this.towers.forEach((tower) => {
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
            } else if (tower.state.aimBehaviour == "last") { // Tower aims at enemy earliest in the path
                for (let i = 0; i < tower.shootRangePath.length; i++) {
                    let square = tower.shootRangePath[i]
                    let enemies = this.map.getEnemies(square.row, square.col)
                    if (enemies.length > 0) {
                        chosenEnemy = enemies[0]
                        break;
                    }
                }
            } else if (tower.state.aimBehaviour == "closest") { // Tower aims at closest enemy in its range
                let closestEnemy = {
                    'enemy': null,
                    'distance': 0
                }
                for (let i = 0; i < tower.shootRangePath.length; i++) {
                    let square = tower.shootRangePath[i]
                    let enemies = this.map.getEnemies(square.row, square.col)
                    if (enemies.length > 0) {
                        enemies.forEach((enemy) => {
                            const distance = Math.sqrt(
                                Math.pow(enemy.position.x - tower.position.x, 2) + 
                                Math.pow(enemy.position.y - tower.position.y, 2)
                            )
                            if (closestEnemy.distance == 0 || distance < closestEnemy.distance) {
                                // This enemy is first to be checked or is the closest so far
                                closestEnemy = {
                                    'enemy': enemy,
                                    'distance': distance
                                }
                            }
                        })
                    }
                }
                chosenEnemy = closestEnemy.enemy
            }

            tower.tick()
            if (chosenEnemy) {  // Aim and try to shoot only if there is an enemy in range
                tower.setTarget(chosenEnemy)
                tower.shoot().forEach((bullet) => {
                    this.map.addBullet(bullet)
                })
            }
        })
    }

    moveBullets() {
        // Move first, so don't double move, but keep track of what needs to be re-added
        let toAdd = []
        this.map.forEachBulletInReverse((bullet) => {
            bullet.move()
            if (bullet.isOffMap(this.map.width, this.map.height, this.map.subgridSize)) {
                this.map.removeBulletPrevPos(bullet) // Remove that bullet, and do not re-add it - it's off the map
            } else if (bullet.isOutOfGivenRange(bullet.range*this.map.subgridSize)) { // Convert to global (since range is configured by number of squares)
                this.map.removeBulletPrevPos(bullet)
            } else if (bullet.hasMovedSquare) {
                this.map.removeBulletPrevPos(bullet)
                toAdd.push(bullet)
            }

            // Do not display a bullet that is still "within" the tower
            bullet.visible = !bullet.isWithinGivenRange(this.map.subgridSize/3)
        })

        // Add the bullets to their new square
        toAdd.forEach((bullet) => {
            this.map.addBullet(bullet)
        })
    }

    removeEnemyDontProcessSubEnemies(enemy) {
        this.map.removeEnemy(enemy)
        this.enemiesRemaining -= 1
    }

    removeEnemy(enemy) {
        this.removeEnemyDontProcessSubEnemies(enemy)

        // Some enemies spawn new enemies when they are destroyed
        // Add these here
        let subEnemies = this.enemyFactory.getSubEnemyTypes(enemy.type)
        if (subEnemies.length > 0) {
            // Is there enough space to add the enemies behind where this enemy died?
            // Most likely yes, so -1. If not enough steps to work backwards, the work forwards.
            let distanceBetweenSubEnemy = Math.floor(this.subgridSize/4)  // this is pretty arbitrary
            let enemyOffset = ((enemy.steps < subEnemies.length*distanceBetweenSubEnemy) ? 1 : -1) * distanceBetweenSubEnemy
            subEnemies.forEach((subEnemyType, idx) => {
                this.addEnemy(subEnemyType, enemy.steps + (enemyOffset * idx))
                this.enemiesRemaining += 1
            })
        }
    }

    processEndOfPathEnemy(enemy) {
        this.lives -= 1 // TODO dependent on enemy type?
        this.removeEnemyDontProcessSubEnemies(enemy)
        this.endOfPathEnemies.push(enemy)
    }

    markEnemyAsAcrossFinish(enemy) {
        enemy.hasReachedEnd = true
    }

    resolveInteractions() {
        // Check all relevant game objects and see how they interact
        // Check collision between enemies and bullets
        this.map.forEachEnemyInReverse((enemy) => { // TODO forEachEnemyAndBullet
            // Get bullets in surrounding squares. Cannot just use single square because we check a line the bullet had moved
            // over for collision, so point of collision may actually be out of the square.
            let bullets = []
            for (let r = Math.max(0, enemy.position.row - 1); r <= Math.min(enemy.position.row + 1, this.map.height - 1); r += 1) {
                for (let c = Math.max(0, enemy.position.col - 1); c <= Math.min(enemy.position.col + 1, this.map.width - 1); c += 1) {
                    bullets = bullets.concat(this.map.map[r][c].bullets)
                }
            }
            for (let bIdx = bullets.length-1; bIdx >= 0; bIdx--) {
                let bullet = bullets[bIdx]
                if (bullet.collidesWith(enemy.position, enemy.hitboxRadius, bullet.hitCircleRadius)) {
                    if (enemy.handleCollision(bullet) || (enemy.blockPiercing && !bullet.canPierceAll())) {
                        this.map.removeBullet(bullet) // Remove that bullet
                    }
                }

                if (enemy.hp <= 0) { // Enemy has been killed
                    let reward = this.enemyFactory.getReward(enemy.type)
                    bullet.originTower.registerKill()

                    const mostDamagingPlayerId = enemy.getMostDamagingPlayerId()
                    // Give money to each player. This is the best way to ensure winning player does not
                    // continue to win. Points reflect the number of kills/damage.
                    this.players.forEach((player) => {
                        player.increaseMoney(reward)

                        // Give full reward to player that got kill, and half points to player that did most damage.
                        // Same player can be both.
                        if (mostDamagingPlayerId && player.id == mostDamagingPlayerId) {
                            player.increasePoints(Math.ceil(reward/2))
                        }
                    })
                    bullet.originTower.player.increasePoints(reward)

                    this.removeEnemy(enemy)
                    break // If enemy has been killed, even if it is removed the enemy object still exist. This can cause a double kill, so skip to next enemy
                }
            }
        })

        // Check if enemy reached end of path
        // This does not remove the enemy, but records the fact that it has reached the end of the path
        // This enemy will be sent to the client so that the sprite can be removed and the animation of it
        // breaching the base can trigger. After this has happened, it can be removed.
        this.map.forEachEnemyInReverse((enemy) => {
            if (enemy.steps > this.map.path.length) {
                this.markEnemyAsAcrossFinish(enemy)
            }
        })
    }

    /**
     * Adds an enemy at the given number of steps down the path
     * @param {Number} enemyType type of enemy to add
     * @param {Number} steps number of steps this enemy has taken
     */
    addEnemy(enemyType, steps) {
        let enemyToAdd = this.enemyFactory.createEnemy(enemyType)
        enemyToAdd.setPosition(steps)
        enemyToAdd.forceTurn(this.map.getGridValue(enemyToAdd.row, enemyToAdd.col))
        this.map.addEnemy(enemyToAdd)
    }

    addEnemyToFront(enemyType) {
        if (enemyType == "gap") return  // This enemy type is used to signify a gap in the enemy flow
        this.map.addNewEnemy(this.enemyFactory.createEnemy(enemyType))
    }

    shiftEnemyQueue() {
        if (this.enemyQueue.length > 0) {
            if (this.enemyQueue[0].ticksUntilGo == 0) {
                this.addEnemyToFront(this.enemyQueue.shift().type)
            } else {
                this.enemyQueue[0].ticksUntilGo -= 1
            }
        }
    }

    addTower(name, type, playerID, row, col) {
        let player = this.getPlayerByName(playerID)
        let newTower = new towerImport.Tower(name, type, player, new point.Point(this.map.subgridSize, col, row, this.subgridMidpoint, this.subgridMidpoint), this.subgridSize, this.ticksPerSecond)
        newTower.calculateShootPath(this.map.mainPath)
        this.towers.push(newTower)
        player.reduceMoney(newTower.getCost()) // Keep player implementation simple and let client determine whether player can afford tower
        this.map.setGridValue(row, col, 't') // Register that there is a tower in that spot
    }

    updateTower(name, property, value) {
        this.towers.forEach((tower) => {
            if (tower.name == name) {
                tower.update(property, value)
            }
        })
    }

    sellTower(name) {
        for (let i = this.towers.length-1; i >= 0; i--) {
            let tower = this.towers[i]
            if (tower.name == name) {
                this.getPlayerByName(tower.player.id).increaseMoney(tower.sellPrice)
                this.map.setGridValue(tower.row, tower.col, 'x')
                this.towers.splice(i, 1)
            }
        }
    }

    upgradeTower(towerName, upgradeType) {
        this.towers.forEach((tower) => {
            const player = this.getPlayerByName(tower.player.id)
            if (tower.name == towerName && player) {
                const playerMoney = player.getMoney()
                const amountSpent = tower.upgrade(upgradeType, playerMoney)
                if (amountSpent !== 0) {
                    // Successful upgrade
                    player.reduceMoney(amountSpent)

                    // Certain upgrades change the range, so need to recalculate the path of squares that can be hit
                    if (upgradeType === "bonus-sawblade" || upgradeType === "range-up") {
                        tower.calculateShootPath(this.map.mainPath)
                    }
                    return true
                }
                return false
            }
        })
        return false
    }

    addPlayer(playerID) {
        let newPlayer = new playerImport.Player(playerID, this.players.length)
        this.players.push(newPlayer)
        this.enemyFactory.updatePlayerCount(this.players.length)
        return newPlayer
    }

    removePlayer(playerID) {
        const playerIdx = this.players.findIndex((player) => player.id == playerID, 1)
        const playerFound = playerIdx >= 0
        if (playerFound) {
            this.players.splice(playerIdx, 1)
        }
        return playerFound
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

    ready() {
        return this.players.every((player) => player.isReady())
    }

    startRound() {
        if (this.roundActive) return // This should not occur
        this.roundActive = true

        // Generate the enemy queue
        let enemiesThisRound = 0
        this.enemyQueue = []
        this.rounds[this.round-1].forEach((enemyData) => {
            for (let i=0; i < enemyData.count; i++) {
                // For each enemy, calculate how many game ticks are required until the "enemisPerSquarePerTimeUnit" number is met
                // This ensures a consistent flow of enemies
                enemyData.enemies.forEach((enemyType) => {
                    if (enemyType == "gap") {
                        this.enemyQueue.push({
                            "type": enemyType,
                            "ticksUntilGo" : enemyData.enemiesPerSquarePerSecond*this.ticksPerSecond
                        })
                    } else {
                        this.enemyQueue.push({
                            "type": enemyType,
                            // this.ticksPerSecond/speed is number of ticks to complete one square, so divide that by the number of enemies to introduce
                            // per second to get the number of ticks between each enemy.
                            //"ticksUntilGo": Math.floor((1/enemyData.enemiesPerSquarePerSecond) * (this.ticksPerSecond/this.enemyFactory.getSpeed(enemyType)))
                            "ticksUntilGo": Math.floor((1/enemyData.enemiesPerSquarePerSecond) * (this.ticksPerSecond))
                        })
                        enemiesThisRound += 1
                    }
                })
            }
        })

        // This is how we determine if the round is over - this many enemies have been killed or got to end
        this.enemiesRemaining = enemiesThisRound

        // Reset players ready status
        this.players.forEach((player) => {
            player.unsetReady()
        })
    }

    // Checks whether the round is currently in progress
    // Determined by whether there are enemies left to kill and bullets on the map
    // If round is over (and was not at the start) increment the round number and reward players their money
    checkForRoundEnd() {
        if (!this.roundActive) return
        if (this.enemiesRemaining == 0 && this.map.numBullets == 0) {
            // Reward players with money for the round
            this.players.forEach((player) => {
                player.increaseMoney(this.getEndOfRoundReward())
            })

            this.round += 1
            this.roundActive = false
        }
    }

    getEndOfRoundReward() {
        return 50 + (this.round)*10
    }

    isRoundActive() {
        return this.roundActive
    }

    isVictory() {
        return this.round > this.maxRounds
    }

    isLoss() {
        return this.lives <= 0
    }

    updateGameObjects() {
        // Update the state of existing enemies
        this.moveEnemies();

        // Move any bullets
        this.moveBullets();

        // Decide which enemy the ower aims at (if any) and shoot
        this.moveTowers();

        // See if enemy reached end, bullet hit, etc.
        this.resolveInteractions();

        // For the current level, determine whether to send another enemy
        this.shiftEnemyQueue();
    }

    update() {
        // Only update the entities in the game if the round is active
        if (this.roundActive) {
            this.updateGameObjects()
            this.checkForRoundEnd()
        }
    }

    getState() {
        if (this.isVictory()) return "over.victory"
        if (this.isLoss()) return "over.loss"
        return "active"
    }

    getRound() {
        return this.round
    }

    getGameStateEnemies() {
        let hash = crypto.createHash("sha256")
        let objects = []
        this.map.forEachEnemy((e) => {
            objects.push({
                "name": e.name,
                "position": e.position,
                "isHit": e.isHit,
                "rotation": e.rotation,
                "type": e.type,
                "collisionAngles": e.collisionAngles,
                "hasReachedEnd": e.hasReachedEnd
            })
            hash.update(e.name)
        })
        return {
            "hash": hash.digest("hex"),
            "objects": objects
        }
    }

    getGameStateTowers() {
        let objects = []
        let hash = crypto.createHash("sha256")
        this.towers.forEach((t) => {
            objects.push({
                "name": t.name,
                "angle": t.angle,
                "position": t.position,
                "playerID": t.player.id,
                "type": t.type,
                "stats": t.stats,
                "hasShot": t.hasShot,
                "level": t.level,
                "aim": t.state.aimBehaviour,
                "sellPrice": t.sellPrice,
                "upgrades": t.getPurchasedUpgrades(),
                "range": t.state.seekRange,
            })
            hash.update(t.name)
        })
        return {
            "hash": hash.digest("hex"),
            "objects": objects
        }
    }

    getGameStateBullets() {
        let state = {
            "objects": []
        }
        this.map.forEachBullet((b) => {
            if (b.visible) {
                state.objects.push({
                    "name": b.name,
                    "position": b.position,
                    "type": b.type,
                    "angle": b.angle,
                })
            }
        })
        return state
    }

    getGameStatePlayers() {
        let state = {
            "objects": []
        }
        this.players.forEach((player) => {
            state.objects.push({
                "playerID": player.id,
                "index": player.index,
                "stats": player.stats
            })
        })
        return state
    }

    getGameStateWorld() {
        return {
            "lives": this.lives,
            "round": this.round
        }
    }

    getGameStateEmpty() {
        return {
            "hash": "",
            "objects": []
        }
    }

    getGameState() {
        // Write the updated state
        let state = {}
        state.players = this.getGameStatePlayers()
        state.towers = this.getGameStateTowers()
        state.worldState = this.getGameStateWorld()
        if (this.roundActive) {
            state.bullets = this.getGameStateBullets()
            state.enemies = this.getGameStateEnemies()
        } else {
            state.bullets = this.getGameStateEmpty()
            state.enemies = this.getGameStateEmpty()
        }
        return state;
    }

    getPlayerFinalResults() {
        // Array that stores the players in order of score from highest to lowest
        let results = []
        this.players.forEach((player) => {
            let i = 0
            let result = {
                id: player.id,
                points: player.stats.points,
                money: player.stats.money
            }

            // Loop over and record the position where the player fits in
            for (i; i < results.length; i += 1) {
                if (player.stats.points > results[i].points ||
                    (player.stats.points == results[i].points) && (player.stats.money > results[i].money)) {
                        break
                }
            }
            results.splice(i, 0, result)
        })
        return results
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
                    this.map.setGridValue(tower.row, tower.col, 't')
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
