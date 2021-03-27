const http = require('http')
const io = require('socket.io');
const session = require('./server/js/session.js')
const networking = require('./server/js/networking.js')
const os = require('os');
const fs = require('fs');
const { Session } = require('inspector');

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

function broadcastPlayers(socket) {
  let gameID = socket.gameID
  let playerID = socket.playerID
  games[gameID].game.forEachPlayer((player)=>{
    if (player.id == playerID) socket.emit(MSG_TYPES.ADD_PLAYER_SELF, games[gameID].game.getPlayerInfo(player.id))
    else socket.emit(MSG_TYPES.ADD_PLAYER, games[gameID].game.getPlayerInfo(player.id))
  })
}


/**
 * To add:
 * 
 * Game class - accepts game ID as param
 * Player/connection class - has a single socket as param
*/
web_sockets_server.on('connection', (socket) => {
  // TODO remove all these "setup" events once it is on a game? so just listenes for game events then?

  // Join game event
  // Player has started or joined game. Create a room with the game ID if one does not exist and send that client the game info.
  socket.on(MSG_TYPES.JOIN_GAME, (data) => {
    console.log("Client " + socket.handshake.address + " joining game " + data.gameID)

    // Assigning these variables is temporary
    socket.gameID = data.gameID
    socket.playerID = socket.handshake.address + data.gameID

    // This is the first request to join this game, so make the game
    if (!(data.gameID in games)) {
      games[data.gameID] = new session.Session(socket, data.gameID, data.playerID, config)
    } else {
      games[data.gameID].addSocket(socket, data.playerID)
    }

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

  socket.on(MSG_TYPES.ADD_PLAYER, () => {
    let gameID = socket.gameID
    let playerID = socket.playerID
    socket.join(gameID)
    if (!games[gameID].game.playerExists(playerID)) {
      games[gameID].game.addPlayer(playerID)
    }

    // Tell all other players about this new player
    socket.to(gameID).emit(MSG_TYPES.ADD_PLAYER, games[gameID].game.getPlayerInfo(playerID))

    // Tell this player about existing players (including itself)
    broadcastPlayers(socket)
  })

  // socket.on(MSG_TYPES.CLIENT_UPDATE_GAME_BOARD, (data, callback) => {
  //   console.log("Updated board from client", data)
  //   // TODO broadcast temporary position to other connected clients
  // });

  // socket.on(MSG_TYPES.CLIENT_DEBUG, (data) => {
  //   console.log(data)
  // })

  // socket.on(MSG_TYPES.DEBUG_EXPORT_GAME_STATE, () => {
  //   games[socket.gameID].game.exportGame()
  // })

  // socket.on(MSG_TYPES.DEBUG_IMPORT_GAME_STATE, () => {
  //   let gameID = socket.gameID
  //   games[gameID].game.importGame().then(()=>{
  //       console.log("Import successful")
  //       // Alternatively (and probably better) sort out exactly what is sent from client and stored in the map structure
  //       web_sockets_server.in(gameID).emit(MSG_TYPES.SERVER_UPDATE_GAME_BOARD, games[gameID].game.getMapStructure())
  //     }).catch((err)=>{
  //       throw err
  //     })
  // })

  // TODO moveinto a store of disconnected players within the session, and then just mve back if the player comes back
  socket.on('disconnect', function() {
    if (socket.playerID != undefined) {
      console.log("DISCONNCETED", socket.playerID)
      socket.to(socket.gameID).emit(MSG_TYPES.REMOVE_PLAYER, games[socket.gameID].game.getPlayerInfo(socket.playerID))
      // For now we leave the player in the game, but they are not used. This is becuase want to keep track of their scores etc if they come back later.
    }
  })
});
