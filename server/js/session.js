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
        this.sockets = {}  // All the connected players
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
    }
}

module.exports = {
    Session: Session
}