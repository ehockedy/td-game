const { Server } = require('socket.io')
const game = require('./game.js')
const mapGenerator = require("./mapGenerator.js")

class Session {
    constructor(socket, gameID, playerID, gameConfig, roundConfig, enemyConfig) {        
        this.gameID = gameID
        this.maxConnections = gameConfig.MAX_PLAYERS  // TODO enforce this
        this.gameConfig = gameConfig
        this.roundConfig = roundConfig
        this.enemyConfig = enemyConfig

        this.sockets = {}  // All the connected players/ TODO I dont think this actually needs to be a map. Just keep ID as socket property.
        this.players = {}
        this.gameSettings = {
            // "numRounds": gameConfig.numRoundOptions[0]  // Default to lowest number of rounds
            "numRounds": roundConfig.rounds.length  // TODO use actual numbers from config once enough rounds added
        }

        this.mapGenerator = new mapGenerator.MapGenerator(gameConfig.MAP_HEIGHT, gameConfig.MAP_WIDTH, gameConfig.SUBGRID_SIZE)
        this.map = this.mapGenerator.generateMap()

        this.hasStarted = false
        this.gameState = "active"  // Can be active, over.victory, or over.loss

        this.addSocket(socket, playerID)
    }

    getPlayerCount() {
        return Object.keys(this.players).length
    }

    addSocket(socket, playerID) {
        socket.join(this.gameID)
        this.sockets[playerID] = socket
        this.players[playerID] = {
            id: playerID,
            displayName: "PLAYER " + (this.getPlayerCount() + 1).toString(),
            colour: this.gameConfig.colours[this.getPlayerCount()].code,
        }
        if (this.hasStarted) {
            if (this.game.playerExists(playerID)) {
                socket.emit("client/view/game")
            } else {
                socket.emit("client/player/notFound")
            }
        } else {
            // Send to self and all others in room
            this.broadcast("client/players/set", this.players)
            this.broadcast("client/gameSettings/set", this.gameSettings)

            // Make socket just joined go to lobby
            socket.emit("client/view/lobby")
        }
        this.setUpEvents(socket)
    }

    // Send this message to every socket in this session
    broadcast(msg, ...args) {
        for (const [id, socket] of Object.entries(this.sockets)) {
            socket.emit(msg, ...args)
        }
    }

    setUpEvents(socket) {
        socket.on("server/map/get", (callback) => {
            callback(this.map.getMapStructure())
        })

        socket.on("server/map/regenerate", (seed)=> {
            this.map = this.mapGenerator.generateMap(seed)
            this.broadcast("client/map/set", this.map.getMapStructure())
        })

        socket.on("server/player/set/name", (playerID, playerName) => {
            // TODO check if name already chosen on submitm not now?
            this.players[playerID].displayName = playerName
            socket.emit("client/players/set", this.players)
            socket.to(this.gameID).emit("client/players/set", this.players)
        })

        socket.on("server/player/set/colour", (playerID, colour) => {
            this.players[playerID].colour = colour
            socket.emit("client/players/set", this.players)
            socket.to(this.gameID).emit("client/players/set", this.players)
        })

        socket.on("server/game/start", ()=> {
            if (!this.hasStarted) {
                this.game = new game.Game(this.map, this.roundConfig.rounds, this.gameSettings, this.enemyConfig)
                this.hasStarted = true
                for (const [id, socket] of Object.entries(this.sockets)) {
                    this.game.addPlayer(id)
                    if (socket.playerID == id) this.broadcast("client/player/addSelf", this.game.getPlayerInfo(id))  // TODO client should be able to verify if it is itself
                    else this.broadcast("client/player/add", this.game.getPlayerInfo(id))
                }
                this.game.start()
                this.gameLoop = setInterval(()=>{this.updateGameAndSend()}, 50*0.2);  // 20 "fps"
                this.broadcast("client/view/game")
            }
        })

        socket.on("server/player/disconnect", (playerID) => {
            this.removePlayer(playerID)
        })

        /**
         * Client will send a message of the example forms:
         * {
         *   "name": "FFFFFF",
         *   "operation": "add",
         *   "parameters": {
         *     "row": 0,
         *     "col": 0,
         *     "type": "rock-thrower"
         *   }
         * }
         *
         * {
         *   "name": "FFFFFF",
         *   "operation": "sell"
         * }
         *
         * {
         *   "name": "FFFFFF",
         *   "operation": "upgrade",
         *   "property": "upgrade",
         *   "value": "range1"
         * }
         *
         * {
         *   "name": "FFFFFF",
         *   "operation": "aim",
         *   "property": "aimBehaviour",
         *   "value": "first"
         * }
         */
         socket.on("server/tower/set", (data) => {
            if (data.operation == "add") {
                this.game.addTower(data.name, data.parameters.type, socket.playerID, data.parameters.row, data.parameters.col)
                this.broadcast("client/map/update", this.map.getMapStructure())
            } else if (data.operation == "aim") {
                this.game.updateTower(data.name, data.property, data.value)
            } else if (data.operation == "sell") {
                this.game.sellTower(data.name)
                this.broadcast("client/map/update", this.map.getMapStructure())
            }
        })

        socket.on("server/game/round/start", ()=>{
            this.game.getPlayerByName(socket.playerID).setReady()
            if (this.game.ready()) {
                // If all players ready, begin the game
                this.game.startRound()
                this.broadcast("client/game/round/start")
            } else {
                // If still some players not ready, alert all players that this player is ready
                this.broadcast("client/player/ready", this.game.getPlayerInfo(socket.playerID))
            }
          })
    }

    // Main processing loop
    // Updates the game state and sends the update to all connected clients in that game room
    updateGameAndSend() {
        this.game.update() // Advance the game by one tick
        this.broadcast("client/game/update", this.game.getGameState())

        // Check to see if the state of the game has changed. This will happen
        // if there is victory/completion or loss
        let state = this.game.getState()
        if (state != this.gameState) {
            // state has changed, update the client
            this.broadcast("client/game/state/set", state, this.game.getPlayerFinalResults())
            this.gameState = state
        }
    }

    removePlayer(playerID) {
        // This removes a player from the session. Once this happens they cannot rejoin the game if it has started.
        this.game.removePlayer(playerID)
        if (playerID in this.players) {
            delete this.players[playerID]
            delete this.sockets[playerID]
        }
    }

    // If all the players have left, then the session is considered over and can be deleted
    isSessionOver() {
        return Object.keys(this.players).length === 0
    }

    // Stops game loop and removes any event listeners for the socket.
    cleanUpSession() {
        clearInterval(this.gameLoop)
    }
}

module.exports = {
    Session: Session
}