const game = require('./game.js')
const mapGenerator = require("./mapGenerator.js")

class Session {
    constructor(socket, gameID, playerID, config) {
        this.sockets = {}  // All the connected players/ TODO I dont think this actually needs to be a map. Just keep ID as socket property.
        this.gameID = gameID
        this.maxConnections = 4
        this.config = config

        this.mapGenerator = new mapGenerator.MapGenerator(config.MAP_HEIGHT, config.MAP_WIDTH, config.SUBGRID_SIZE)
        this.map = this.mapGenerator.generateMap()

        this.hasStarted = false

        this.addSocket(socket, playerID)
    }

    addSocket(socket, playerID) {
        if (this.hasStarted) {
            if (this.game.playerExists(playerID)) {
                socket.emit("client/view/game")
            } else {
                socket.emit("client/player/notFound")
            }
        } else {
            socket.emit("client/view/lobby")
        }
        this.sockets[playerID] = socket
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

        /**
         * Client will send a message of the form:
         * {
         *   "gameID": "ABCDEF",
         *   "resource": "tower",
         *   "update": {
         *     "name": "012345",
         *     "aimBehaviour": "first"
         *   }
         * }
         */
        socket.on("server/tower/update", (data) => {
            if (data.resource == "tower") {
                this.game.updateTower(data.name, data.updates)
            }
        })

        socket.on("server/game/start", ()=> {
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
        })

        // Player has confirmed placement of tower
        socket.on("server/map/set", (data) => {
            this.game.map.setGridProperty(data.row, data.col, "value", 't') // Register that there is a tower in that spot
            this.game.addTower(data.id, data.type, socket.playerID, data.row, data.col)
            this.broadcast("client/map/update", this.map.getMapStructure())
        });

        socket.on("server/game/round/start", ()=>{
            this.game.getPlayerByName(socket.playerID).setReady()
            if (this.game.ready()) {
              this.game.advanceLevel()
              this.broadcast("client/game/round/start")
            }
            this.broadcast("client/player/ready", this.game.getPlayerInfo(socket.playerID))
          })
    }

    // Main processing loop
    // Updates the game state and sends the update to all connected clients in that game room
    updateGameAndSend() {
        if (this.game.roundActive()) {
            this.game.updateActiveGameState() // Advance the game by one tick

            if (!this.game.roundActive()) { // Round is over
                this.broadcast("client/game/round/end", this.game.getNextRoundInfo())
            }
        } else {
            this.game.updateInactiveGameState()
        }

        let new_state = this.game.getGameState()
        this.broadcast("client/game/update", new_state)
  }
}

module.exports = {
    Session: Session
}