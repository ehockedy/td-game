const socket = io();

// Send message to server to start game
socket.emit("START")