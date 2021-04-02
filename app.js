const http = require('http')
const io = require('socket.io');
const session = require('./server/js/session.js')
const networking = require('./server/js/networking.js')
const os = require('os');
const fs = require('fs');

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

let configJson = fs.readFileSync('shared/json/gameConfig.json');
let config = JSON.parse(configJson);

function parseGameConfig(config) {
  function logError(configOpt, errorMsg) {
    console.log("Config error:")
    console.log("  Config setting:", configOpt)
    console.log("  Config value:", config[configOpt])
    console.log("  Error message:", errorMsg)
    return false
  }
  if (config.MAP_WIDTH % 2 == 1) {
    return logError("MAP_WIDTH", "Must be an even positive integer")
  } else if  (config.MAP_HEIGHT % 2 == 1) {
    return logError("MAP_HEIGHT", "Must be an even positive integer")
  } else if  (config.SUBGRID_SIZE % 2 == 0) {
    return logError("SUBGRID_SIZE", "Must be an odd positive integer")
  }
  return true
}

if (!parseGameConfig(config)) {
  process.exit(1)
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


function gameExists(gameID) {
  return gameID in games
}

web_sockets_server.on('connection', (socket) => {
  // TODO remove all these "setup" events once it is on a game? so just listenes for game events then?

  // Join game event
  // Player has started or joined game. Create a room with the game ID if one does not exist and send that client the game info.
  socket.on("server/session/join", (data) => {
    console.log("Client " + socket.handshake.address + " joining game " + data.gameID)

    // Assigning these variables is temporary
    socket.gameID = data.gameID
    socket.playerID = socket.handshake.address + data.gameID

    // This is the first request to join this game, so make the game
    if (!(data.gameID in games)) {
      games[data.gameID] = new session.Session(socket, data.gameID, socket.playerID, config)
    } else {
      games[data.gameID].addSocket(socket, data.playerID)
    }

  });

  // Check whether a game with the given ID exists
  socket.on("server/session/verify", (data, callback) => {
    if (gameExists(data.gameID)) {
      console.log("Game found")
      callback({ response: "success" })
    } else {
      console.log("Game not found")
      callback({ response: "fail" })
    }
  })

  // TODO moveinto a store of disconnected players within the session, and then just mve back if the player comes back
  socket.on('disconnect', function() {
    if (socket.playerID != undefined) {
      console.log("DISCONNCETED", socket.playerID)

      // TODO REMV PLAYER

      //socket.to(socket.gameID).emit(MSG_TYPES.REMOVE_PLAYER, games[socket.gameID].game.getPlayerInfo(socket.playerID))
      // For now we leave the player in the game, but they are not used. This is becuase want to keep track of their scores etc if they come back later.
    }
  })
});
