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
  CHECK_GAME: "cg",
  LOBBY_START: "ls",
  CLIENT_DEBUG: "cd",
  ADD_PLAYER: "ap",
  ADD_PLAYER_SELF: "aps",
  REMOVE_PLAYER: "rp"
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

function gameExists(gameID) {
  return gameID in games
}

function addPlayer(socket, gameID, playerID) {
  socket.join(gameID)
  if (!games[gameID].playerExists(playerID)) {
    games[gameID].addPlayer(playerID)
  }

  // Tell all other players about this new player
  socket.to(gameID).emit(MSG_TYPES.ADD_PLAYER, games[gameID].getPlayerInfo(playerID))

  // Tell this player about existing players (including itself)
  games[gameID].forEachPlayer((player)=>{
    if (player.id == playerID) socket.emit(MSG_TYPES.ADD_PLAYER_SELF, games[gameID].getPlayerInfo(player.id))
    else socket.emit(MSG_TYPES.ADD_PLAYER, games[gameID].getPlayerInfo(player.id))
  })

  // Tell new player about the map
  socket.emit(MSG_TYPES.SERVER_UPDATE_GAME_BOARD, games[gameID].getMapStructure())
}

web_sockets_server.on('connection', (socket) => {
  // Join game event
  // Player has started or joined game. Create a room with the game ID if one does not exist and send that client the game info.
  socket.on(MSG_TYPES.JOIN_GAME, (data) => {
    console.log("Client " + socket.handshake.address + " joining game " + data.gameID)
    socket.gameID = data.gameID
    socket.playerID = socket.handshake.address + data.gameID

    // This is the first request to join this game, so make the game
    if (!(socket.gameID in games)) {
      games[data.gameID] = game.setUpGame(config.MAP_WIDTH, config.MAP_HEIGHT, config.SUBGRID_SIZE)
    }

    socket.emit(MSG_TYPES.LOBBY_START)
  });

  // Check whether a game with the given ID exists
  socket.on(MSG_TYPES.CHECK_GAME, (data, callback) => {
    if (gameExists(data.gameID)) {
      console.log("Game found")
      callback({ response: "success" })
    } else {
      console.log("Game not found")
      callback({ response: "fail" })
    }
  })

  socket.on(MSG_TYPES.LOBBY_START, () => {
    addPlayer(socket, socket.gameID, socket.playerID)
  })

  socket.on(MSG_TYPES.GAME_START, (data)=>{
    socket.emit(MSG_TYPES.GAME_START)
    setInterval(updateGameAndSend, 50*0.2, data.gameID); // 20 "fps"
  })

  socket.on(MSG_TYPES.CLIENT_UPDATE_GAME_BOARD, (data, callback) => {
    console.log("Updated board from client", data)
    // TODO broadcast temporary position to other connected clients
  });

  // Player has confirmed placement of tower
  socket.on(MSG_TYPES.CLIENT_UPDATE_GAME_BOARD_CONFIRM, (data) => {
    let gameID = data.gameID
    games[gameID].map.setGridValue(data.y, data.x, data.value, "tower")
    games[gameID].addTower(data.towerName, data.value.type, socket.handshake.address+data.gameID, data.y, data.x)
    web_sockets_server.in(gameID).emit(MSG_TYPES.SERVER_UPDATE_GAME_BOARD, games[gameID].getMapStructure())
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

  socket.on('disconnect', function() {
    if (socket.playerID != undefined) {
      console.log("DISCONNCETED", socket.playerID)
      socket.to(socket.gameID).emit(MSG_TYPES.REMOVE_PLAYER, games[socket.gameID].getPlayerInfo(socket.playerID))
      // For now we leave the player in the game, but they are not used. This is becuase want to keep track of their scores etc if they come back later.
    }
  })
});



// TODO
// give kisses to beanie
