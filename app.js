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
var live_sockets = {}

// Main processing loop
// Updates the game state and sends the update to all connected clients
function updateGameAndSend() {
  new_state = game.updateGameState()
  console.log(new_state)
  for (host in live_sockets) {
    live_sockets[host].emit(MSG_TYPES.SERVER_UPDATE_GAME_STATE, new_state)
  }
}

// Must do this first
game.setUpGame(30, 24, 7)

web_sockets_server.on('connection', (socket) => {
  let client_addr = socket["handshake"]["address"]
  console.log("Client " + client_addr + " connected")

  if (!(client_addr in live_sockets)) {
    console.log("New connection")
  }
  live_sockets[client_addr] = socket

  socket.on(MSG_TYPES.CONNECT, (data) => {
    console.log("Client started game\n")
    setInterval(updateGameAndSend, 50*10);
  });
  socket.emit(MSG_TYPES.SERVER_UPDATE_GAME_BOARD, game.getMap())
});



// TODO
// give kisses to beanie
