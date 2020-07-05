const http = require('http')
const io = require('socket.io');
const networking = require('./server/js/modules/networking.js')
networking.setRootDir(__dirname) // Set the location to get files from

// First set up http server to serve index.html and its included files
const http_server = http.createServer(networking.requestListener);

http_server.listen(8000, () => {
   console.log('HTTP server listening on *:8000');
});

// From then on can connect over WebSocket using socket.io client
const web_sockets_server = io(http_server)

web_sockets_server.on('connection', (socket) => {
  // Commands from client
  socket.on("START", (data) => {
    console.log("Client started game\n")
  })
});

// TODO
// give kisses to beanie
