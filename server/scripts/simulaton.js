const game = require('../js/game.js')
const mapGenerator = require("../js/mapGenerator.js")
const fs = require('fs');

// Run simulations of the game to assess difficulty


function loadConfig(filename) {  // todo de duplicate this from other files
    let configJson = fs.readFileSync(filename);
    return JSON.parse(configJson);
}

let gameConfig = loadConfig('shared/json/gameConfig.json')
let roundConfig = loadConfig('shared/json/rounds.json')
let towerConfig = loadConfig('shared/json/towers.json')
let enemyConfig = loadConfig('shared/json/enemies.json')

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
        this.playerID = 1
    }

    // Sets up a game using the given seed. Having this seed ensures can re-run with the same maps and tower choices (if random) over and over again
    runSimulation(seed) {
        this.seed = seed
        this.map = this.mapGenerator.generateMap(seed.toString())
        this.game = new game.Game(this.map, this.roundConfig.rounds, this.gameSettings, this.enemyConfig)
        this.player = this.game.addPlayer(this.playerID)

        this.simulationSummary = {}

        this.round = 0
        let gameState = "in_progress"
        while (gameState == "in_progress") {            
            // If round is not active, immediately start it
            if (!this.game.isRoundActive()) {
                // Record the state at the start of the round
                this.simulationSummary[this.round] = {
                    "livesRemaining": this.game.getGameStateWorld().lives,
                    "towersBought": []
                }

                // Attempt to buy towers between rounds
                this._buyTowersMostExpensive()  // TODO put in switch with other tower buying methods
                
                // Start next round
                this.round += 1
                this.game.startRound()

                //this.mapGenerator.printMap()
            }

            // Update state
            gameState = this.game.updateGameState()
        }

        // Summary at end
        this.simulationSummary[this.round] = {
            "livesRemaining": this.game.getGameStateWorld().lives,
            "towersBought": []
        }
        return this.simulationSummary
    }

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
            this.game.addTower("name", mostExpensiveTowerType, this.playerID, currentBest.row, currentBest.col)
            this.simulationSummary[this.round].towersBought.push(mostExpensiveTowerType)

            // Calculate the available towers
            availableTowers = this.getAffordableTowers()
        }
    }
}

let simulation = new Simulator(gameConfig, roundConfig, enemyConfig, towerConfig)
console.log(simulation.runSimulation(1))