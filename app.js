const http = require('http')
const io = require('socket.io');
const game = require('./server/js/game.js')
const networking = require('./server/js/networking.js')
const os = require('os');
const config = require('./server/js/constants.js')
networking.setRootDir(__dirname) // Set the location to get files from

const interfaces = os.networkInterfaces();
let listeningAddress = ""
if (interfaces.hasOwnProperty("WiFi")) {
  for (let intfIdx=0; intfIdx < interfaces["WiFi"].length; intfIdx++) {
    if (interfaces["WiFi"][intfIdx]["address"].split('.')[0] == "192" &&
        interfaces["WiFi"][intfIdx]["address"].split('.')[1] == "168") {
          listeningAddress = interfaces["WiFi"][intfIdx]["address"]
        }
  }
}

// MUST keep these synced with enum in client
// Shared file did not work due to inconsistency with import/require in browser/node
// See https://socket.io/docs/emit-cheatsheet/ for list of words that should not be used
const MSG_TYPES = {
  CONNECT: "client connection",
  GAME_START: "game start",
  SERVER_UPDATE_GAME_STATE: "server update game state",
  SERVER_UPDATE_GAME_BOARD: "server update game board", //  Make this some kind of init?
  CLIENT_UPDATE: "client update",
  CLIENT_UPDATE_GAME_BOARD: "client update game board",
  CLIENT_UPDATE_GAME_BOARD_CONFIRM: "client update set game board",
  NEW_GAME: "ng",
  JOIN_GAME: "jg",
  CLIENT_DEBUG: "cd",
  ADD_PLAYER: "ap"
}

// First set up http server to serve index.html and its included files
const http_server = http.createServer(networking.requestListener);
http_server.listen(8000, () => {
   console.log('HTTP server listening on ' + listeningAddress + ':8000');
});

// From then on can connect over WebSocket using socket.io client
const web_sockets_server = io(http_server)

// Keep track of current games
let games = {}

// Main processing loop
// Updates the game state and sends the update to all connected clients in that game room
function updateGameAndSend(gameID) {
  let new_state = games[gameID].updateGameState()
  web_sockets_server.in(gameID).emit(MSG_TYPES.SERVER_UPDATE_GAME_STATE, new_state)
}

web_sockets_server.on('connection', (socket) => {

  // New game event
  // Player has started a new game. Create a room with the game ID and send that client the game info.
  socket.on(MSG_TYPES.NEW_GAME, (data) => {
    let clientAddr = socket.handshake.address
    console.log("Client " + clientAddr + " connected")

    let gameID = data.gameID
    socket.join(gameID)
    games[gameID] = game.setUpGame(config.MAP_WIDTH, config.MAP_HEIGHT, config.SUBGRID_SIZE)
    games[gameID].addPlayer(data.playerID)

    socket.emit(MSG_TYPES.SERVER_UPDATE_GAME_BOARD, games[gameID].getMapStructure(), config.MAP_HEIGHT, config.MAP_WIDTH, config.SUBGRID_SIZE)
    socket.emit(MSG_TYPES.ADD_PLAYER, games[gameID].getPlayerInfo(data.playerID))
    socket.emit(MSG_TYPES.GAME_START)

    setInterval(updateGameAndSend, 50*0.2, gameID); // 20 "fps"
  });

  // Join game event
  // Check if game exists, add it and send info if so, send failure message if not
  socket.on(MSG_TYPES.JOIN_GAME, (data, callback) => {
    let clientAddr = socket.handshake.address
    let gameID = data.gameID
    console.log("Client " + clientAddr + " attempting to join game " + gameID)

    if (!(gameID in games)) {
      console.log("Game does not exist")
      callback({ response: "fail" })
    } else {
      console.log("Game found")
      socket.join(gameID)
      games[gameID].addPlayer(data.playerID)
      callback({ response: "success" })

      // Tell new player about the map
      // TODO this is same msg type as L119 but different num of args
      socket.emit(MSG_TYPES.SERVER_UPDATE_GAME_BOARD, games[gameID].getMapStructure(), config.MAP_HEIGHT, config.MAP_WIDTH, config.SUBGRID_SIZE)
      socket.emit(MSG_TYPES.ADD_PLAYER, games[gameID].getPlayerInfo(data.playerID))
      socket.emit(MSG_TYPES.GAME_START)
    }
  })

  socket.on(MSG_TYPES.CLIENT_UPDATE_GAME_BOARD, (data, callback) => {
    console.log("Updated board from client", data)
    // TODO broadcast temporary position to other connected clients
  });

  // Player has confirmed placement of tower
  socket.on(MSG_TYPES.CLIENT_UPDATE_GAME_BOARD_CONFIRM, (data) => {
    let gameID = data.gameID
    games[gameID].map.setGridValue(data.y, data.x, data.value, "tower")
    games[gameID].addTower(data.towerName, data.value.type, data.value.playerID, data.y, data.x)
    // TODO dont need the dimension args
    web_sockets_server.in(gameID).emit(MSG_TYPES.SERVER_UPDATE_GAME_BOARD, games[gameID].getMapStructure(), config.MAP_HEIGHT, config.MAP_WIDTH, config.SUBGRID_SIZE)
  });

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
    let gameID = data.gameID
    if (data.resource == "tower") {
      games[gameID].updateTower(data.name, data.updates)
    }
  })

  socket.on(MSG_TYPES.CLIENT_DEBUG, (data) => {
    console.log(data)
  })
});



// TODO
// give kisses to beanie
