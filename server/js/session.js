const game = require('./game.js')

// TODO copy over whils restructuring, then replace with just the event strings that have been rewritten to be better organised
const MSG_TYPES = {
    CONNECT: "client connection",
    GAME_START: "game start",
    GAME_START_PLAYER_NOT_PRESENT: "pnp",
    GAME_START_REQUEST: "gsr",
    GET_MAP: "gm",
    GET_MAP_REGENERATE: "gmr",
    SERVER_UPDATE_GAME_STATE: "server update game state",
    SERVER_UPDATE_GAME_BOARD: "server update game board", //  Make this some kind of init?
    SERVER_SET_GAME_BOARD: "sb",
    CLIENT_UPDATE: "client update",
    CLIENT_UPDATE_GAME_BOARD: "client update game board",
    CLIENT_UPDATE_GAME_BOARD_CONFIRM: "client update set game board",
    NEW_GAME: "ng",
    JOIN_GAME: "jg",
    CHECK_GAME: "cg",
    LOBBY_START: "ls",
    CLIENT_DEBUG: "cd",
    ADD_PLAYER: "ap",
    ADD_PLAYER_SELF: "aps",
    REMOVE_PLAYER: "rp",
    ROUND_START: "rs",
    ROUND_END: "re",
    PLAYER_READY: "pr",
    DEBUG_EXPORT_GAME_STATE: "debug_export",
    DEBUG_IMPORT_GAME_STATE: "debug_import"
  }

class Session {
    constructor(socket, gameID, playerID, config) {
        this.sockets = {}  // All the connected players/ TODO I dont think this actually needs to be a map. Just keep ID as socket property.
        this.gameID = gameID
        this.maxConnections = 4

        this.game = game.setUpGame(config.MAP_WIDTH, config.MAP_HEIGHT, config.SUBGRID_SIZE)  // TODO remove this. Should have a map gneerator, and then an actual game represtation that map is passed to
        this.addSocket(socket, playerID)
    }

    addSocket(socket, playerID) {
        if (this.game.hasStarted) {
            if (this.game.playerExists(playerID)) {
                socket.emit(MSG_TYPES.GAME_START)
            } else {
                socket.emit(MSG_TYPES.GAME_START_PLAYER_NOT_PRESENT)
            }
        } else {
            socket.emit(MSG_TYPES.LOBBY_START)
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
        socket.on(MSG_TYPES.GET_MAP, ()=> {
            socket.emit(MSG_TYPES.SERVER_SET_GAME_BOARD, this.game.getMapStructure())
        })

        socket.on(MSG_TYPES.GET_MAP_REGENERATE, (mapArgs)=> {
            this.game.generateMap(mapArgs.seed)
            socket.emit(MSG_TYPES.SERVER_SET_GAME_BOARD, this.game.getMapStructure())
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
        socket.on(MSG_TYPES.CLIENT_UPDATE, (data) => {
            if (data.resource == "tower") {
                this.game.updateTower(data.name, data.updates)
            }
        })

        socket.on(MSG_TYPES.GAME_START_REQUEST, ()=> {
            this.game.start()
            setInterval(()=>{this.updateGameAndSend()}, 50*0.2);  // 20 "fps"
            this.broadcast(MSG_TYPES.GAME_START)
        })

        // Player has confirmed placement of tower
        socket.on(MSG_TYPES.CLIENT_UPDATE_GAME_BOARD_CONFIRM, (data) => {
            this.game.map.setGridProperty(data.row, data.col, "value", 't') // Register that there is a tower in that spot
            this.game.addTower(data.id, data.type, socket.playerID, data.row, data.col)
            this.broadcast(MSG_TYPES.SERVER_UPDATE_GAME_BOARD, this.game.getMapStructure())
        });

        socket.on(MSG_TYPES.ROUND_START, ()=>{
            this.game.getPlayerByName(socket.playerID).setReady()
            if (this.game.ready()) {
              this.game.advanceLevel()
              this.broadcast(MSG_TYPES.ROUND_START)
            }
            this.broadcast(MSG_TYPES.PLAYER_READY, this.game.getPlayerInfo(socket.playerID))
          })
    }

    // Main processing loop
    // Updates the game state and sends the update to all connected clients in that game room
    updateGameAndSend() {
        if (this.game.roundActive()) {
            this.game.updateActiveGameState() // Advance the game by one tick

            if (!this.game.roundActive()) { // Round is over
                this.broadcast(MSG_TYPES.ROUND_END, this.game.getNextRoundInfo())
            }
        } else {
            this.game.updateInactiveGameState()
        }

        let new_state = this.game.getGameState()
        this.broadcast(MSG_TYPES.SERVER_UPDATE_GAME_STATE, new_state)
  }
}

module.exports = {
    Session: Session
}