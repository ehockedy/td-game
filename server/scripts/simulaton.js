const game = require('../js/game.js')
const mapGenerator = require("../js/mapGenerator.js")
const tower = require('../js/tower.js')

// Run simulations of the game to assess difficulty
class Simulator {
    constructor(gameConfig, roundConfig, enemyConfig, towerConfig) {
        this.mapGenerator = new mapGenerator.MapGenerator(gameConfig.MAP_HEIGHT, gameConfig.MAP_WIDTH, gameConfig.SUBGRID_SIZE)

        this.gameConfig = gameConfig
        this.roundConfig = roundConfig
        this.enemyConfig = enemyConfig
        this.towerConfig = towerConfig
        this.towerKeys = Object.keys(this.towerConfig)

        this.gameSettings = {
            "numRounds": roundConfig.rounds.length
        }
        this.playerID = "sim_player"  // Name set in simulation client
        this.sendToClient = false  // Whether there is a client that can receive updates via a connected socket

        this.results = {}
    }

    // Must be called if want to visualise updates
    setSocket(socket) {
        this.socket = socket
    }

    setupSimulation(seed) {
        this.map = this.mapGenerator.generateMap(seed.toString())   
        this.game = new game.Game(this.map, this.roundConfig.rounds, this.gameSettings, this.enemyConfig)
        this.player = this.game.addPlayer(this.playerID)
        this.round = 0

        // Holds all the important stats about this one game, added to master results list at end of simulation
        // Use arrays where each index is the round
        this.simulationSummary = {
            "seed": seed,
            "livesRemaining": [],  // Array that holds the number of lives at the start of each round
            "towersBought": []  // Array that holds an array for each round with teh names of the towers purchased before the round started
        }
        // Results example
        // {
        //     "mostExpensive": [
        //         {
        //             "seed": 1,
        //             "livesRemaining": [100, 100, 90, 90, 85],
        //             "towersBought": [["shrapnel-burst", "shrapnel-burst"], [], [], [], ["rock-scatter"]]
        //         }
        //     ]
        // }
    }

    recordCurrentState(lives, towers) {
        if (this.simulationSummary.livesRemaining.length == this.round) {
            this.simulationSummary.livesRemaining.push(lives)
            this.simulationSummary.towersBought.push(towers)
        } else {
            console.log("WARNING: setting current round info for a round that has already been done")
        }
    }

    // Sets up a game using the given seed. Having this seed ensures can re-run with the same maps and tower choices (if random) over and over again
    runSimulation(seed, towerPurchaseMethod) {
        this.setupSimulation(seed)
        this.fullSpeedLoop(towerPurchaseMethod)
        this.processResults(towerPurchaseMethod)
    }

    async runSimulationWithView(seed, towerPurchaseMethod) {
        this.setupSimulation(seed)
        this.socket.emit("client/map/set", this.map.getMapStructure())
        return this.visualisedLoop(towerPurchaseMethod)
    }

    // Checks if the round has changed and records the current state if so, does any tower buying,
    // and then immediately starts the next round
    checkForRoundChange(towerPurchaseMethod) {
        // If round is not active, immediately start it
        if (!this.game.isRoundActive()) {            
            // Attempt to buy towers between rounds
            let towersBought
            switch(towerPurchaseMethod) {
                case "mostExpensive":
                    towersBought = this._buyTowersMostExpensive()
                    break
                default:
                    console.log("WARNING: towerPurchaseMethod not found")
            }

            // Record the state at the start of the round
            this.recordCurrentState(this.game.getGameStateWorld().lives, towersBought)
            
            // Start next round
            this.round += 1
            this.game.startRound()
        }
    }

    fullSpeedLoop(towerPurchaseMethod) {
        // Speed thorough the game as fast as possible
        let gameState = "in_progress"
        while (gameState == "in_progress") {
            this.checkForRoundChange(towerPurchaseMethod)
            gameState = this.game.updateGameState()
        }
        // Summary at end
        this.recordCurrentState(this.game.getGameStateWorld().lives, [])
    }

    async visualisedLoop(towerPurchaseMethod) {
        const perLoopIterations = 20
        const loopPeriod_ms = 1
        // Starts a periodic loop that every iteration updates the game state, and possibly sends
        // an update to the client. The reason an update is not sent on every iteration
        // is becasue the game would move too fast that the client could not render fast enough.
        let gameState = "in_progress"
        let loopIdx = 0
        while(gameState == "in_progress") {
            this.checkForRoundChange(towerPurchaseMethod)
            gameState = this.game.updateGameState()                  

            if (loopIdx == 0) {
                // Send update for client to render
                this.socket.emit("client/game/update", this.game.getGameState())

                // Sleep so client not overloaded. Not very Javascript-y, but this is a simulation test script
                // so not too fussed.
                await new Promise(r => setTimeout(r, loopPeriod_ms));
            }
            loopIdx = (loopIdx + 1) % perLoopIterations
        }
        // Summary at end
        this.recordCurrentState(this.game.getGameStateWorld().lives, [])
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

    // Spends all the money buying the most expensive available tower each time
    _buyTowersMostExpensive() {
        let availableTowers = this.getAffordableTowers()
        let boughtTowers = []
        while (availableTowers.length > 0) {
            let mostExpensiveTowerType = availableTowers[availableTowers.length - 1]
            let currentBest = {
                "row": 0,
                "col": 0,
                "squares": 0,
            }
            // TODO ensure map not full of towers, and 0,0 not taken

            // Iterate over all the available squares and identify the one gives the tower the most number of
            // path squares in its sights
            for (let r = 0; r < this.gameConfig.MAP_HEIGHT; r += 1) {
                for (let c = 0; c < this.gameConfig.MAP_WIDTH; c += 1) {
                    // Check if is unoccupied space
                    if (this.map.getGridValue(r, c) == 'x') {
                        let numberOfSquares = this.map.getNumberOfPathSquaresInRange(r, c, this.towerConfig[mostExpensiveTowerType].gameData.seekRange)
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
            this.game.addTower(Math.random().toString(36).substr(2, 5), mostExpensiveTowerType, this.playerID, currentBest.row, currentBest.col)
            boughtTowers.push(mostExpensiveTowerType)

            // Calculate the available towers
            availableTowers = this.getAffordableTowers()
        }
        return boughtTowers
    }

    processResults(towerPurchaseMethod) {
        if (!(towerPurchaseMethod in this.results)) {
            this.results[towerPurchaseMethod] = []
        }
        this.results[towerPurchaseMethod].push(this.simulationSummary)
        console.log(this.results)
    }

    getResults() {
        return this.results
    }
}

module.exports = {
    Simulator: Simulator
}  
