const game = require('./game.js')
const mapGenerator = require("./mapGenerator.js")

class Session {
    constructor(socket, gameID, playerID, config) {
        this.sockets = {}  // All the connected players/ TODO I dont think this actually needs to be a map. Just keep ID as socket property.
        this.players = {}
        this.gameID = gameID
        this.maxConnections = config.MAX_PLAYERS  // TODO enforce this
        this.config = config

        this.mapGenerator = new mapGenerator.MapGenerator(config.MAP_HEIGHT, config.MAP_WIDTH, config.SUBGRID_SIZE)
        this.map = this.mapGenerator.generateMap()

        this.hasStarted = false

        this.addSocket(socket, playerID)
    }

    addSocket(socket, playerID) {
        socket.join(this.gameID)
        this.sockets[playerID] = socket
        this.players[playerID] = {
            displayName: "Player " + (Object.keys(this.players).length + 1).toString(),
            colour: "red",  // todo change
        }
        if (this.hasStarted) {
            if (this.game.playerExists(playerID)) {
                socket.emit("client/view/game")
            } else {
                socket.emit("client/player/notFound")
            }
        } else {
            // Send to self and all others in room
            socket.emit("client/players/set", this.players)
            socket.to(this.gameID).emit("client/players/set", this.players)

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

        socket.on("server/game/start", ()=> {
            if (!this.hasStarted) {
                this.game = new game.Game(this.map)
                this.hasStarted = true
                for (const [id, socket] of Object.entries(this.sockets)) {
                    this.game.addPlayer(id)
                    if (socket.playerID == id) this.broadcast("client/player/addSelf", this.game.getPlayerInfo(id))  // TODO client should be able to verify if it is itself
                    else this.broadcast("client/player/add", this.game.getPlayerInfo(id))
                }
                this.game.start()
                setInterval(()=>{this.updateGameAndSend()}, 50*0.2);  // 20 "fps"
                this.broadcast("client/view/game")
            }
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
              this.game.startRound()
              this.broadcast("client/game/round/start")
            }
            this.broadcast("client/player/ready", this.game.getPlayerInfo(socket.playerID))
          })
    }

    // Main processing loop
    // Updates the game state and sends the update to all connected clients in that game room
    updateGameAndSend() {
        this.game.updateGameState() // Advance the game by one tick
        this.broadcast("client/game/update", this.game.getGameState())
  }
}

module.exports = {
    Session: Session
}