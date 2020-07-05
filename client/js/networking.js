import { setState } from "./state.js"

// MUST keep these synced with enum in server
// Shared file did not work due to inconsistency with import/require in browser/node
// See https://socket.io/docs/emit-cheatsheet/ for list of words that should not be used
const MSG_TYPES = {
    CONNECT: "start",
    SERVER_UPDATE: "server update",
    CLIENT_UPDATE: "client update"
}

//console.log(MSG_TYPES.CONNECT)
const socket = io();

// Send message to server to start game
socket.emit(MSG_TYPES.CONNECT)

// socket.on('connection', (socket) => {
//     console.log("Connected to server")
// });

socket.on(MSG_TYPES.SERVER_UPDATE, (data) => {
    setState(data)
});
