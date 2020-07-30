import { setState, setBoard } from "./state.js"

// To get client side debugging, paste "localStorage.debug = '*';" into
// the browser console

// MUST keep these synced with enum in server
// Shared file did not work due to inconsistency with import/require in browser/node
// See https://socket.io/docs/emit-cheatsheet/ for list of words that should not be used
const MSG_TYPES = {
    CONNECT: "start",
    SERVER_UPDATE_GAME_STATE: "server update game state",
    SERVER_UPDATE_GAME_BOARD: "server update game board",
    CLIENT_UPDATE: "client update"
}

const socket = io();

// Send message to server to start game
socket.emit(MSG_TYPES.CONNECT)

socket.on(MSG_TYPES.SERVER_UPDATE_GAME_STATE, (data) => {
    setState(data)
});

socket.on(MSG_TYPES.SERVER_UPDATE_GAME_BOARD, (data) => {
    setBoard(data)
});
