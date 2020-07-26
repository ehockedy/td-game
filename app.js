const http = require('http')
const io = require('socket.io');
const game = require('./server/js/game.js')
const networking = require('./server/js/networking.js')
networking.setRootDir(__dirname) // Set the location to get files from

// MUST keep these synced with enum in client
// Shared file did not work due to inconsistency with import/require in browser/node
// See https://socket.io/docs/emit-cheatsheet/ for list of words that should not be used
const MSG_TYPES = {
  CONNECT: "start",
  SERVER_UPDATE_GAME_STATE: "server update game state",
  SERVER_UPDATE_GAME_BOARD: "server update game board", //  Make this some kind of init?
  CLIENT_UPDATE: "client update"
}

// First set up http server to serve index.html and its included files
const http_server = http.createServer(networking.requestListener);

http_server.listen(8000, () => {
   console.log('HTTP server listening on *:8000');
});

// From then on can connect over WebSocket using socket.io client
const web_sockets_server = io(http_server)

// Keep track of current connections
live_sockets = []

// Main processing loop
// Updates the game state and sends the update to all connected clients
function updateGameAndSend() {
  new_state = game.updateGameState()
  live_sockets.forEach(function(item, index) {
    item.emit(MSG_TYPES.SERVER_UPDATE_GAME_STATE, new_state)
  });
}

web_sockets_server.on('connection', (socket) => {
  // save the connection
  console.log("New connection")
  live_sockets.push(socket)

  // Send game board
  live_sockets.forEach(function(item, index) {
    var map = new game.GameMap(26, 36)
    item.emit(MSG_TYPES.SERVER_UPDATE_GAME_BOARD, map.generateMap())
  });

  socket.on(MSG_TYPES.CONNECT, (data) => {
    console.log("Client started game\n")
    setInterval(updateGameAndSend, 50);
  });
});


// TODO
// give kisses to beanie
