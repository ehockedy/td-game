const http = require('http')
const io = require('socket.io');
const game = require('./server/js/game.js')
const networking = require('./server/js/networking.js')
const os = require('os');
const config = require('./server/js/constants.js')
networking.setRootDir(__dirname) // Set the location to get files from

const interfaces = os.networkInterfaces();
let listeningAddress = ""
for (let intfIdx=0; intfIdx < interfaces["WiFi"].length; intfIdx++) {
  if (interfaces["WiFi"][intfIdx]["address"].split('.')[0] == "192" &&
      interfaces["WiFi"][intfIdx]["address"].split('.')[1] == "168") {
        listeningAddress = interfaces["WiFi"][intfIdx]["address"]
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
  JOIN_GAME: "jg"
}

// First set up http server to serve index.html and its included files
const http_server = http.createServer(networking.requestListener);

http_server.listen(8000, () => {
   console.log('HTTP server listening on ' + listeningAddress + ':8000');
});

// From then on can connect over WebSocket using socket.io client
const web_sockets_server = io(http_server)

// Keep track of current connections
let rooms = {}

// Main processing loop
// Updates the game state and sends the update to all connected clients
function updateGameAndSend(room) {
  new_state = rooms[room]["game"].updateGameState()
  //console.log(new_state)
  for (host in rooms[room]["players"]) {
    rooms[room]["players"][host].emit(MSG_TYPES.SERVER_UPDATE_GAME_STATE, new_state)
  }
}

web_sockets_server.on('connection', (socket) => {
  socket.on(MSG_TYPES.NEW_GAME, (data) => {
    console.log(data)

    let clientAddr = socket["handshake"]["address"]
    let gameID = data["gameID"]
    console.log("Client " + clientAddr + " connected")

    // Create room if does not exist
    if (!(gameID in rooms)) {
      console.log("New room created")
      rooms[gameID] = {}
      rooms[gameID]["game"] = game.setUpGame(config.MAP_WIDTH, config.MAP_HEIGHT, config.SUBGRID_SIZE),
      rooms[gameID]["players"] = {}
      rooms[gameID]["players"][clientAddr] = socket
    }

    // Add player to that room if they are not already in
    if (!(clientAddr in rooms[gameID]["players"])) {
      rooms[gameID]["players"][clientAddr] = socket
    }

    console.log(rooms)

    socket.emit(MSG_TYPES.SERVER_UPDATE_GAME_BOARD, rooms[gameID]["game"].getMapStructure(), config.MAP_HEIGHT, config.MAP_WIDTH, config.SUBGRID_SIZE)
    updateGameAndSend(gameID)
    setInterval(updateGameAndSend,50*0.5, gameID); // 20 "fps"
    socket.emit(MSG_TYPES.GAME_START)
  });

  socket.on(MSG_TYPES.JOIN_GAME, (data, callback) => {
    console.log(data)
    let clientAddr = socket["handshake"]["address"]
    let gameID = data["data"]["gameID"]
    console.log("Client " + clientAddr + " attempting to join game " + gameID)

    if (!(gameID in rooms)) {
      console.log("Game does not exist")
      callback({
        response: "fail"
      })
    } else {
      console.log("Game found")
      rooms[gameID]["players"][clientAddr] = socket
      callback({
        response: "success"
      })

      // Tell new player about the map
      socket.emit(MSG_TYPES.SERVER_UPDATE_GAME_BOARD, rooms[gameID]["game"].getMapStructure(), config.MAP_HEIGHT, config.MAP_WIDTH, config.SUBGRID_SIZE)

      // TODO wait for above to be done?
      socket.emit(MSG_TYPES.GAME_START)
    }
  })

  // socket.on(MSG_TYPES.CLIENT_UPDATE_GAME_BOARD, (data, callback) => {
  //   console.log("Updated board from client", data)
  //   // TODO broadcast temporary position to other connected clients
  // });

  socket.on(MSG_TYPES.CLIENT_UPDATE_GAME_BOARD_CONFIRM, (data) => {
    let clientAddr = socket["handshake"]["address"]
    let gameID = data["gameID"]
    console.log("Writing board change from client")
    rooms[gameID]["game"].map.setGridValue(data["y"], data["x"], data["value"]) // row, col, value
    console.log("DATA", data)
    rooms[gameID]["game"].addTower(data["towerName"], data["value"], "TODO", data["y"], data["x"])
    for (host in rooms[gameID]["players"]) {
      socket.emit(MSG_TYPES.SERVER_UPDATE_GAME_BOARD, rooms[gameID]["game"].getMapStructure()) // TODO broadcast this
    }
  });
});



// TODO
// give kisses to beanie
