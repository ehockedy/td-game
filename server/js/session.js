const game = require('./game.js')
const mapGenerator = require("./mapGenerator.js")

// Use to generate map seed - same as client code
function randomStringFromAlphabet(len, alphabet) {
    let randomString = ""
    for (let i=0; i < len; i++) {
        randomString += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return randomString
}

function randomAlphaCharString(len) {
    let alphabet = "ABCDEFGHIJKLMNPQRSTUVWXYZ" // Exclude O to avoid confusion with zero
    return randomStringFromAlphabet(len, alphabet)
}

class Session {
    constructor(socket, gameID, playerID, gameConfig, roundConfig, enemyConfig) {        
        this.gameID = gameID
        this.maxConnections = gameConfig.MAX_PLAYERS  // TODO enforce this
        this.gameConfig = gameConfig
        this.roundConfig = roundConfig
        this.enemyConfig = enemyConfig

        this.mapGenerator = new mapGenerator.MapGenerator(gameConfig.MAP_HEIGHT, gameConfig.MAP_WIDTH, gameConfig.SUBGRID_SIZE)
        const mapSeed = randomAlphaCharString(6)
        this.map = this.mapGenerator.generateMap(mapSeed)

        this.hasStarted = false
        this.gameLoopActive = false

        // Update frequencies
        this.ticksPerSecond = 30  // This does not affect the speed of the game, just the frequency of updates.
        this.baseUpdateFrequency_ms = 1000 / this.ticksPerSecond
        this.fastForwardUpdateFrequency = this.baseUpdateFrequency_ms / 3  // speed up
        this.updateFrequency_ms = this.baseUpdateFrequency_ms

        this.sockets = {}  // All the connected players/ TODO I dont think this actually needs to be a map. Just keep ID as socket property.
        this.players = {}
        this.disconnectedPlayers = {}

        this.gameSettings = {
            "numRounds": roundConfig.rounds.length,
            "ticksPerSecond": this.ticksPerSecond,
            "difficulty": "medium",
            "lives": 100,
            "currentRound": 1,  // Mainly used by front end to know which round starting at if player re-joins
        }
        this.addSocket(socket, playerID)
    }

    getPlayerCount() {
        return Object.keys(this.players).length
    }

    addSocket(socket, playerID) {
        // TODO tidy this function
        socket.join(this.gameID)
        this.sockets[playerID] = socket

        // If player already exists, move back into the active players map
        if (playerID in this.disconnectedPlayers) {
            this.players[playerID] = this.disconnectedPlayers[playerID]
            delete this.disconnectedPlayers[playerID]
            this.game.getPlayerByName(playerID).setConnected(true)
        } else {
            this.players[playerID] = {
                id: playerID,
                displayName: "PLAYER " + (this.getPlayerCount() + 1).toString(),
                colour: this.gameConfig.colours[this.getPlayerCount()].code,
            }
        }

        if (this.hasStarted) {
            if (this.game.playerExists(playerID)) {
                socket.emit("client/players/set", {...this.players, ...this.disconnectedPlayers})
                socket.emit("client/gameSettings/set", this.gameSettings)
                socket.emit("client/map/set", this.map.getMapStructure(), this.mapGenerator.seed)
                socket.emit("client/view/game")
            } else {
                socket.emit("client/player/notFound")
            }
        } else {
            // Send to self and all others in room
            this.broadcast("client/players/set", this.players)
            this.broadcast("client/gameSettings/set", this.gameSettings)
            this.broadcast("client/map/set", this.map.getMapStructure(), this.mapGenerator.seed)

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
            this.broadcast("client/map/set", this.map.getMapStructure(), seed)
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
                this.gameLoopActive = true
                this.gameLoop = this.updateGameAndSendLoop();
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
         *   "value": "dmg-up"
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
            } else if (data.operation == "upgrade") {
                this.game.upgradeTower(data.name, data.type)
            }
        })

        socket.on("server/game/round/start", ()=>{
            this.game.getPlayerByName(socket.playerID).setReady()
            if (this.game.ready()) {
                // If all players ready, begin the game
                this.game.startRound()
                this.broadcast("client/game/round/start")
            }
        })

        socket.on("server/game/round/toggleFastForward", () => {
            // TODO this works fine, things to sort out:
            // - should updates actually be sent on each update in this ff state
            if (this.updateFrequency_ms == this.fastForwardUpdateFrequency) {
                this.updateFrequency_ms = this.baseUpdateFrequency_ms
            } else {
                this.updateFrequency_ms = this.fastForwardUpdateFrequency
            }
            this.broadcast("client/game/round/toggleFastForward")
        })

        socket.on("server/game/settings/set", (settingName, settingValue) => {
            if (settingName in this.gameSettings) {
                this.gameSettings[settingName] = settingValue
            }
            this.broadcast("client/gameSettings/set", this.gameSettings)
        })
    }

    // Main processing step
    // Updates the game state and sends the update to all connected clients in that game room
    updateGameAndSend() {
        const round = this.game.getRound()
        const state = this.game.getState()
        this.game.update() // Advance the game by one tick
        this.broadcast("client/game/update", this.game.getGameState())

        // Check to see if the state of the game has changed. This will happen
        // if there is victory/completion or loss
        const updatedState = this.game.getState()
        if (state != updatedState) {
            // state has changed, update the client
            this.broadcast("client/game/state/set", updatedState, this.game.getPlayerFinalResults())
        }

        // Round changed, reset the frequency
        if (round != this.game.getRound()) {
            this.updateFrequency_ms = this.baseUpdateFrequency_ms
            this.gameSettings.currentRound =  this.game.getRound()
        }
    }

    // Main processing loop
    updateGameAndSendLoop() {
        // After timeout, calls update function then calls this function again
        // Doing it this way rather than setInterval allows update frequency to change
        return setTimeout(() => {
                if (this.gameLoopActive) {
                    this.updateGameAndSend()
                    this.updateGameAndSendLoop()
                }
            },
            this.updateFrequency_ms)
    }

    removePlayer(playerID) {
        // This removes a player from the session. Once this happens they cannot rejoin the game if it has started.
        if (this.game) {
            this.game.removePlayer(playerID)
        }
        if (playerID in this.players) {
            delete this.players[playerID]
            delete this.sockets[playerID]
        }
    }

    disconnectPlayer(playerID) {
        // This temporarily moves a player into a disconnected state. Moves back if they rejoin
        // The player is stll part of the game
        if (playerID in this.players) {
            const playerInfo = this.players[playerID]
            this.disconnectedPlayers[playerID] = playerInfo
            delete this.players[playerID]
            delete this.sockets[playerID]
            if (this.game) {
                this.game.getPlayerByName(playerID).setConnected(false)
            }
        }
    }

    // If all the players have left, then the session is considered over and can be deleted
    isSessionOver() {
        return Object.keys(this.players).length === 0
    }

    // Stops game loop and removes any event listeners for the socket.
    cleanUpSession() {
        this.gameLoopActive = false
        clearInterval(this.gameLoop)
    }
}

module.exports = {
    Session: Session
}