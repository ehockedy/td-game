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

        this.towerBuyingMap = {
            "mostExpensive": this._buyTowersMostExpensive,
            "mostExpensiveEveryOtherRound": this._buyTowersMostExpensiveEveryOtherRound,
            "random": this._buyTowersRandom,
            "randomEveryOtherRound": this._buyTowersRandomEveryOtherRound,
            "mostRecentlyUnlockedMaxTwo": this._buyMostRecentlyUnlockedMaxTwo,
            "mostRecentlyUnlockedMaxThree": this._buyMostRecentlyUnlockedMaxThree,
            "mostRecentlyUnlockedMaxFour": this._buyMostRecentlyUnlockedMaxFour,
        }

        // Members used by specific tower buying methods
        this.towerTypesBought = {}

        // Holds all the important stats about this one game, added to master results list at end of simulation
        // Use arrays where each index is the round
        this.simulationSummary = {
            "seed": seed,
            "livesRemaining": new Array(this.game.maxRounds + 1).fill(0),  // Array that holds the number of lives at the start of each round. Add 1 because extra entry after final round is added.
            "towersBought": new Array(this.game.maxRounds + 1).fill([]) // Array that holds an array for each round with the names of the towers purchased before the round started
        }
    }

    recordCurrentState(lives, towers) {
        this.simulationSummary.livesRemaining[this.round] = lives
        this.simulationSummary.towersBought[this.round] = towers
    }


    // Checks if the round has changed and records the current state if so, does any tower buying,
    // and then immediately starts the next round
    checkForRoundChange(towerPurchaseMethod) {
        // If round is not active, immediately start it
        if (!this.game.isRoundActive()) {            
            // Attempt to buy towers between rounds
            let towersBought = this.towerBuyingMap[towerPurchaseMethod].call(this)
            towersBought.forEach((towerType) => {
                let bestPlace = this.getBestPlaceForTower(towerType)
                this.game.addTower(Math.random().toString(36).substr(2, 5), towerType, this.playerID, bestPlace.row, bestPlace.col)
            })


            // Record the state at the start of the round
            this.recordCurrentState(this.game.getGameStateWorld().lives, towersBought)
            
            // Start next round
            this.round += 1
            this.game.startRound()
        }
    }

    async simulationLoop(towerPurchaseMethod, perLoopIterations=1000, loopPeriod_ms=0, socket=undefined) {
        // Starts a periodic loop that every iteration updates the game state, and possibly sends
        // an update to the client. The reason an update is not sent on every iteration
        // is becasue the game would move too fast that the client could not render fast enough.
        // Even if update not sent (non-visual simulation) still need to have an occasional timeaout
        // to ensure the event loop is not blocked
        
        let loopIdx = 0
        let gameState = "in_progress"
        while (gameState == "in_progress") {
            this.checkForRoundChange(towerPurchaseMethod)
            gameState = this.game.updateGameState()

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

    getBestPlaceForTower(towerType) {
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
        if (this.round % 2 == 0) {
            return this._buyTowersRandom()
        }
        return []
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

    _buyMostRecentlyUnlockedMaxTwo() {
        return this._buyMostRecentlyUnlockedMaxN(2)
    }

    _buyMostRecentlyUnlockedMaxThree() {
        return this._buyMostRecentlyUnlockedMaxN(3)
    }

    _buyMostRecentlyUnlockedMaxFour() {
        return this._buyMostRecentlyUnlockedMaxN(4)
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

        this.gameSettings = {
            "numRounds": roundConfig.rounds.length
        }
    }

    setupSimulation(seed) {
        let map = this.mapGenerator.generateMap(seed.toString())   
        return new game.Game(map, this.roundConfig.rounds, this.gameSettings, this.enemyConfig)
    }

    // Sets up a game using the given seed. Having this seed ensures can re-run with the same maps and tower choices (if random) over and over again
    async runSimulation(seed, towerPurchaseMethod) {
        console.log("Starting simulation with seed:", seed, ", and tower purchase method:", towerPurchaseMethod)
        let gameSimulation = new SimulatedGame(this.setupSimulation(seed), seed, this.gameConfig, this.towerConfig)

        // Run simulation with very infrequent timeout stops, and as short as possible. This is so that
        // simulations are run quickly, but still break to allow event loop to process
        // Pass socket as undefined
        return gameSimulation.simulationLoop(towerPurchaseMethod, 1000, 0, undefined)
    }

    async runSimulationWithView(seed, towerPurchaseMethod, socket) {
        console.log("Starting simulation with seed:", seed, ", and tower purchase method:", towerPurchaseMethod)
        let game = this.setupSimulation(seed)
        socket.emit("client/map/set", game.map.getMapStructure())
        let gameSimulation = new SimulatedGame(game, seed, this.gameConfig, this.towerConfig)

        // Have frequent, but very quick breaks when sending the update to client. Every 20 frames are sent with
        // this configuraition.
        return gameSimulation.simulationLoop(towerPurchaseMethod, 20, 1, socket)
    }
}

module.exports = {
    Simulator: Simulator
}  
