const game = require('./game.js')

class Session {
    constructor(socket, gameID, playerID, config) {
        this.sockets = {}  // All the connected players
        this.gameID = gameID
        this.maxConnections = 4

        this.addSocket(socket, playerID)
        this.game = game.setUpGame(config.MAP_WIDTH, config.MAP_HEIGHT, config.SUBGRID_SIZE)  // TODO remove this. Should have a map gneerator, and then an actual game represtation that map is passed to
    }

    addSocket(socket, playerID) {
        this.sockets[playerID] = socket
    }
}

module.exports = {
    Session: Session
}