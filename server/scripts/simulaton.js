const game = require('../js/game.js')
const mapGenerator = require("../js/mapGenerator.js")

// Represents a single instance of a simulated run
class SimulatedGame {
    constructor(game, seed, gameConfig, towerConfig) {
        this.game = game
        this.map = this.game.map

        this.gameConfig = gameConfig
        this.towerConfig = towerConfig
        this.towerKeys = Object.keys(this.towerConfig)

        this.playerID = "sim_player"  // Name set in simulation client
        this.player = this.game.addPlayer(this.playerID)
        this.round = 0

        this.loopTick = 0
        this.purchaseMidRoundTrigger = 100  // Once every N ticks, can attempt to make a purchase

        this.towerBuyingMap = {
            "mostExpensive": {
                "fn": this._buyTowersMostExpensive,
                "purchaseMidRound": false
            },
            "mostExpensiveEveryOtherRound": {
                "fn": this._buyTowersMostExpensiveEveryOtherRound,
                "purchaseMidRound": false
            },
            "random": {
                "fn": this._buyTowersRandom,
                "purchaseMidRound": false
            },
            "randomEveryOtherRound": {
                "fn": this._buyTowersRandomEveryOtherRound,
                "purchaseMidRound": false
            },
            "mostRecentlyUnlockedMaxThree": {
                "fn": this._buyMostRecentlyUnlockedMaxThree,
                "purchaseMidRound": false
            },
            "mostRecentlyUnlockedMaxFour": {
                "fn": this._buyMostRecentlyUnlockedMaxFour,
                "purchaseMidRound": false
            },
            "mostRecentlyUnlockedMaxFive": {
                "fn": this._buyMostRecentlyUnlockedMaxFive,
                "purchaseMidRound": false
            },
            "mostRecentlyUnlockedMaxFourMidRound": {
                "fn": this._buyMostRecentlyUnlockedMaxFour,
                "purchaseMidRound": true
            },
            "mostRecentlyUnlockedMaxFiveMidRound": {
                "fn": this._buyMostRecentlyUnlockedMaxFive,
                "purchaseMidRound": true
            }
        }

        this.upgradeBuyingMap = {
            "none": {
                "fn": () => [],
                "purchaseBeforeTowers": true
            },
            "buyOneCheapestBeforeTowers": {
                "fn": this._buyOneUpgradeCheapest,
                "purchaseBeforeTowers": true
            },
            "buyOneCheapestAfterTowers": {
                "fn": this._buyOneUpgradeCheapest,
                "purchaseBeforeTowers": false
            },
        }

        // Members used by specific tower buying methods
        this.towerTypesBought = {}
        this.towersBoughtThisRound = []
        this.upgradesBoughtThisRound = []

        // Holds all the important stats about this one game, added to master results list at end of simulation
        // Use arrays where each index is the round
        this.simulationSummary = {
            "seed": seed,
            "livesRemaining": new Array(this.game.maxRounds + 1).fill(0),  // Array that holds the number of lives at the start of each round. Add 1 because extra entry after final round is added.
            "towersBought": new Array(this.game.maxRounds + 1).fill([]), // Array that holds an array for each round with the names of the towers purchased before the round started
            "upgradesBought": new Array(this.game.maxRounds + 1).fill([]) // Array that holds an array for each round with the names of the upgrades purchased before the round started
        }
    }

    recordCurrentState(lives, towers, upgrades) {
        this.simulationSummary.livesRemaining[this.round] = lives
        this.simulationSummary.towersBought[this.round] = towers
        this.simulationSummary.upgradesBought[this.round] = upgrades
    }

    buyTowers(towerPurchaseMethod) {
        let towersBought = this.towerBuyingMap[towerPurchaseMethod].fn.call(this)
        towersBought.forEach((towerType) => {
            let bestPlace = this.getBestPlaceForTower(towerType)
            let towerName = Math.random().toString(36).substr(2, 5)
            this.game.addTower(towerName, towerType, this.playerID, bestPlace.row, bestPlace.col)

            // I think some towers are better when set to have specific aim properties
            if (towerType == "spear-launcher") {
                this.game.updateTower(towerName, "aimBehaviour", "last")
            }
            this.towersBoughtThisRound.push(towerType)
        })
    }

    buyUpgrades(upgradePurchaseMethod) {
        let upgradesBought = this.upgradeBuyingMap[upgradePurchaseMethod].fn.call(this)
        upgradesBought.forEach(({upgradeType, towerName}) => {
            this.game.upgradeTower(towerName, upgradeType)
            this.upgradesBoughtThisRound.push(upgradeType)
        })
    }


    // Checks if the round has changed and records the current state if so, does any tower buying,
    // and then immediately starts the next round
    checkForRoundChange(towerPurchaseMethod, upgradePurchaseMethod) {
        // Buy towers if end of round, or mid-round purchase is triggered
        // If end of round, immediately start next one
        const isEndOfRound = !this.game.isRoundActive()
        const canPurchaseTowers = (this.towerBuyingMap[towerPurchaseMethod].purchaseMidRound && this.loopTick == this.purchaseMidRoundTrigger)
        if (isEndOfRound || canPurchaseTowers) {
            this.loopTick = 0

            // Attempt to buy towers between rounds
            if (this.upgradeBuyingMap[upgradePurchaseMethod].purchaseBeforeTowers) {
                this.buyUpgrades(upgradePurchaseMethod)
                this.buyTowers(towerPurchaseMethod)
            } else {
                this.buyTowers(towerPurchaseMethod)
                this.buyUpgrades(upgradePurchaseMethod)
            }

            // Only need to record state is end of round
            if (isEndOfRound) {
                // Record the state at the start of the round
                this.recordCurrentState(this.game.getGameStateWorld().lives, this.towersBoughtThisRound, this.upgradesBoughtThisRound)
                this.towersBoughtThisRound = []
                this.upgradesBoughtThisRound = []
                
                // Start next round
                this.round += 1
                this.game.startRound()
            }
        }
        this.loopTick += 1
    }

    async simulationLoop(towerPurchaseMethod, upgradePurchaseMethod, perLoopIterations=1000, loopPeriod_ms=0, socket=undefined) {
        // Starts a periodic loop that every iteration updates the game state, and possibly sends
        // an update to the client. The reason an update is not sent on every iteration
        // is becasue the game would move too fast that the client could not render fast enough.
        // Even if update not sent (non-visual simulation) still need to have an occasional timeaout
        // to ensure the event loop is not blocked
        
        let loopIdx = 0
        let gameState = "active"
        while (gameState == "active") {
            this.checkForRoundChange(towerPurchaseMethod, upgradePurchaseMethod)
            this.game.update()
            gameState = this.game.getState()

            // To avoid blocking event loop
            if (loopIdx == 0) {
                // Send update for client to render
                if (socket) {
                    socket.emit("client/game/update", this.game.getGameState())
                }

                // Sleep so client not overloaded. Not very Javascript-y, but this is a simulation test script
                // so not too fussed.
                await new Promise(r => setTimeout(r, loopPeriod_ms));
            }
            loopIdx = (loopIdx + 1) % perLoopIterations
        }
        // Summary at end
        this.recordCurrentState(this.game.getGameStateWorld().lives, [])
        return this.simulationSummary
    }

    // Iterates over the tower config and adds the towers that the player can afford to a list, which gets returned.
    // Assumes towers are in price order.
    getAffordableTowers() {
        let availableTowers = []
        for (let towerIdx = 0; towerIdx < this.towerKeys.length; towerIdx += 1) {
            let towerName = this.towerKeys[towerIdx]

            // Player can afford, add to the list
            if (this.towerConfig[towerName].cost <= this.player.getMoney()) {
                availableTowers.push(towerName)
            } else break
        }
        return availableTowers
    }

    // Search through all the purchased towers for the available upgrades and return which ones are available
    getAvailableUpgrades() {
        let availableUpgrades = []
        this.game.towers.forEach((tower) => {
            Object.entries(tower.upgrades).forEach(([upgradeType, {cost, purchased}]) => {
                if (!purchased && cost <= this.player.getMoney()) {
                    availableUpgrades.push({
                        'towerName': tower.name,
                        'upgradeType': upgradeType,
                        'cost': cost,
                    })
                }
            })
        })
        return availableUpgrades
    }

    getBestPlaceForRockScatter() {
        let currentBest = {
            "row": 0,
            "col": 0,
            "squares1": 0,
            "squares2": 0,
        }
        for (let c = 0; c < this.gameConfig.MAP_WIDTH; c += 1) {
            for (let r = 0; r < this.gameConfig.MAP_HEIGHT; r += 1) {
                // Check if is unoccupied space
                if (this.map.getGridValue(r, c) == 'x') {
                    // I think rock scatter works best in places where there are lots of adjacent track squares,
                    // to ensure all the rocks hit
                    let potentialBest = {
                        "row": r,
                        "col": c,
                        "squares1": this.map.getNumberOfPathSquaresInRange(r, c, 1),
                        "squares2": this.map.getNumberOfPathSquaresInRange(r, c, 2),
                    }

                    if (potentialBest.squares1 > currentBest.squares1) {
                        // More squares in immediate area, overall better
                        currentBest = potentialBest
                    } else if (potentialBest.squares1 == currentBest.squares1) {
                        // Equal to best number of squares, check at a distance of 2 away
                        if (potentialBest.squares2 > currentBest.squares2) {
                            currentBest = potentialBest
                        }
                    }
                }
            }
        }
        return currentBest
    }

    getBestPlaceForSpearLauncher() {
        let currentBest = {
            "row": 0,
            "col": 0,
            "squares": 0,
        }
        for (let c = 0; c < this.gameConfig.MAP_WIDTH; c += 1) {
            for (let r = 0; r < this.gameConfig.MAP_HEIGHT; r += 1) {
                // Check if is unoccupied space
                if (this.map.getGridValue(r, c) == 'x') {
                    // Keeping the row the same, look up and down the row and record how many of the tiles
                    // are path tiles. Do it up to the current row/column, since shooting left or up is much
                    // preferred, otherwise enemies are moving away from you.
                    let colMin = Math.max(0, c - this.towerConfig["spear-launcher"].gameData.shootRange)
                    //let colMax = Math.min(this.gameConfig.MAP_WIDTH, c + this.towerConfig[towerType].gameData.shootRange)
                    let colPathLen = 0
                    for (let col = colMin; col <= c; col++) {
                        // This is a bit cheeky, but just checks if the given tile is a path - returns 1 if so (because only 1 tile checked)
                        // and 0 otherwise.
                        colPathLen += this.map.getNumberOfPathSquaresInRange(r, col, 0)
                    }

                    // Do the same looking across the row
                    let rowMin = Math.max(0, r - this.towerConfig["spear-launcher"].gameData.shootRange)
                    //let rowMax = Math.min(this.gameConfig.MAP_HEIGHT, r + this.towerConfig[towerType].gameData.shootRange)
                    let rowPathLen = 0
                    for (let row = rowMin; row <= r; row++) {
                        rowPathLen += this.map.getNumberOfPathSquaresInRange(row, c, 0)
                    }

                    let pathSquares = Math.max(colPathLen, rowPathLen)
                    if (pathSquares > currentBest.squares) {
                        currentBest = {
                            "row": r,
                            "col": c,
                            "squares": pathSquares,
                        }
                    }
                }
            }
        }

        // Might have run out of decent spaces, so just give one with best coverage
        if (currentBest.squares <= 1) return this.getBestPlaceForTowerDefault("spear-launcher")
        return currentBest
    }

    getBestPlaceForTowerDefault(towerType) {
        let currentBest = {
            "row": 0,
            "col": 0,
            "squares": 0,
        }
        // TODO ensure map not full of towers, and 0,0 not taken

        // Iterate over all the available squares and identify the one gives the tower the most number of
        // path squares in its sights
        // Go through each column left to right, so that is multiple squares are the same, it pick the one
        // closest to the start of the track.
        for (let c = 0; c < this.gameConfig.MAP_WIDTH; c += 1) {
            for (let r = 0; r < this.gameConfig.MAP_HEIGHT; r += 1) {
                // Check if is unoccupied space
                if (this.map.getGridValue(r, c) == 'x') {
                    let numberOfSquares = this.map.getNumberOfPathSquaresInRange(r, c, this.towerConfig[towerType].gameData.seekRange)
                    if (numberOfSquares > currentBest.squares) {
                        currentBest = {
                            "row": r,
                            "col": c,
                            "squares": numberOfSquares
                        }
                    }
                }
            }
        }
        return currentBest
    }

    getBestPlaceForTower(towerType) {
        switch(towerType) {
            case "rock-scatter":
                return this.getBestPlaceForRockScatter()
            case "spear-launcher":
                return this.getBestPlaceForSpearLauncher()
            default:
                return this.getBestPlaceForTowerDefault(towerType)
        }
    }

    // Spends all the money buying the most expensive available tower each time
    _buyTowersMostExpensive() {
        let availableTowers = this.getAffordableTowers()
        if (availableTowers.length > 0) return [availableTowers[availableTowers.length - 1]]
        return []
    }

    // Every other round, spend all the money
    _buyTowersMostExpensiveEveryOtherRound() {
        let towers = []
        if (this.round % 2 == 0) {
            let mostExpensiveTower = this._buyTowersMostExpensive()
            let money = this.player.stats.money
            while (mostExpensiveTower != [] && money >= this.towerConfig[mostExpensiveTower[0]].cost) {
                towers = towers.concat(mostExpensiveTower)
                money -= this.towerConfig[mostExpensiveTower[0]].cost
                mostExpensiveTower = this._buyTowersMostExpensive()
            }
        }
        return towers
    }

    _buyTowersRandom() {
        let availableTowers = this.getAffordableTowers()
        if (availableTowers.length > 0) return [availableTowers[Math.floor(Math.random() * availableTowers.length)]]
        return []
    }

    _buyTowersRandomEveryOtherRound() {
        let towers = []
        if (this.round % 2 == 0) {
            //return this._buyTowersRandom()
            // todo deduplicate code
            let mostExpensiveTower = this._buyTowersRandom()
            let money = this.player.stats.money
            while (mostExpensiveTower != [] && money >= this.towerConfig[mostExpensiveTower[0]].cost) {
                towers = towers.concat(mostExpensiveTower)
                money -= this.towerConfig[mostExpensiveTower[0]].cost
                mostExpensiveTower = this._buyTowersRandom()
            }
        }
        return towers
    }

    // Saves for the next type of tower that has not been bought yet. If cannot afford it yet, will
    // buy the next most expensive, with a limit of two of each type.
    _buyMostRecentlyUnlockedMaxN(max) {
        let targetIdx = Math.min(Object.keys(this.towerTypesBought).length, Object.keys(this.towerConfig).length-1)  // Only up to the maximum possible tower idx
        const nextUnpurchasedTowerIdx = targetIdx
        let availableTowers = this.getAffordableTowers()
        let boughtTowers = []
        if (availableTowers.length > 0) {  // Can afford a tower
            while (targetIdx >= 0) {
                if (targetIdx < availableTowers.length) { // The desired tower to buy is affordable
                    let towerType = Object.keys(this.towerConfig)[targetIdx]
                    if (targetIdx == nextUnpurchasedTowerIdx) {  // The target tower is the next unpurchased tower and is yet to be purchased
                        this.towerTypesBought[towerType] = 1
                        boughtTowers.push(towerType)
                        break
                    } else if (this.towerTypesBought[towerType] < max) {  // The target tower is below the maximum number of purchases
                        this.towerTypesBought[towerType] += 1
                        boughtTowers.push(towerType)
                        break
                    }
                }
                targetIdx -= 1  // Go to the next most expensive tower
            }
        }
        return boughtTowers
    }

    _buyMostRecentlyUnlockedMaxThree() {
        return this._buyMostRecentlyUnlockedMaxN(3)
    }
    
    _buyMostRecentlyUnlockedMaxFour() {
        return this._buyMostRecentlyUnlockedMaxN(4)
    }
    
    _buyMostRecentlyUnlockedMaxFive() {
        return this._buyMostRecentlyUnlockedMaxN(5)
    }

    // Upgrade purchasing functions
    _buyOneUpgradeCheapest() {
        const availableUpgrades = this.getAvailableUpgrades()
        if (availableUpgrades.length == 0) {
            return []
        }

        const cheapest = availableUpgrades.reduce((cheapest, testValue) => testValue.cost < cheapest.cost ? testValue : cheapest)
        return [cheapest]
    }
}


// Run simulations of the game to assess difficulty
class Simulator {
    constructor(gameConfig, roundConfig, enemyConfig, towerConfig) {
        this.mapGenerator = new mapGenerator.MapGenerator(gameConfig.MAP_HEIGHT, gameConfig.MAP_WIDTH, gameConfig.SUBGRID_SIZE)

        this.gameConfig = gameConfig
        this.roundConfig = roundConfig
        this.enemyConfig = enemyConfig
        this.towerConfig = towerConfig
        this.ticksPerSecond = 1000

        this.gameSettings = {
            "numRounds": roundConfig.rounds.length,
            // This is not true, but for simulation it speeds it up. If used actual value, would run at normal speed which we do
            // not want. As long as this value is same as actual game, the results will be the same. since speeds/ROF will be the same.
            // A problem is they are not is that ceil functions will alter speeds slightly, due to the fact that speeds are multiplied
            // based on subgrid size and this value (ticksPerSecond).
            "ticksPerSecond": 40
        }
    }

    setupSimulation(seed) {
        let map = this.mapGenerator.generateMap(seed.toString())   
        return new game.Game(map, this.roundConfig.rounds, this.gameSettings, this.enemyConfig)
    }

    // Sets up a game using the given seed. Having this seed ensures can re-run with the same maps and tower choices (if random) over and over again
    async runSimulation(seed, towerPurchaseMethod, upgradePurchaseMethod) {
        console.log("Starting simulation with seed:", seed, ", and tower purchase method:", towerPurchaseMethod, ', and upgrade purchase method:', upgradePurchaseMethod)
        let gameSimulation = new SimulatedGame(this.setupSimulation(seed), seed, this.gameConfig, this.towerConfig)

        // Run simulation with very infrequent timeout stops, and as short as possible. This is so that
        // simulations are run quickly, but still break to allow event loop to process
        // Pass socket as undefined
        return gameSimulation.simulationLoop(towerPurchaseMethod, upgradePurchaseMethod, this.ticksPerSecond, 0, undefined)
    }

    async runSimulationWithView(seed, towerPurchaseMethod, upgradePurchaseMethod, socket) {
        console.log("Starting simulation with seed:", seed, ", and tower purchase method:", towerPurchaseMethod, ', and upgrade purchase method:', upgradePurchaseMethod)
        let game = this.setupSimulation(seed)
        socket.emit("client/map/set", game.map.getMapStructure())
        let gameSimulation = new SimulatedGame(game, seed, this.gameConfig, this.towerConfig)

        // Have frequent, but very quick breaks when sending the update to client. Every 20 frames are sent with
        // this configuraition.
        return gameSimulation.simulationLoop(towerPurchaseMethod, upgradePurchaseMethod, 20, 1, socket)
    }
}

module.exports = {
    Simulator: Simulator
}  
