import { setState, setBoard, setGridDimsRowsCols, setSubGridDim , getGameID } from "./state.js"
import { startRendering as startRenderingMenu, stopRendering as stopRenderingMenu} from "./menu_renderer.js"
import { startRendering as startRenderingGame } from "./renderer.js"
import { printMap } from "./tools.js"

// To get client side debugging, paste "localStorage.debug = '*';" into
// the browser console

// MUST keep these synced with enum in server
// Shared file did not work due to inconsistency with import/require in browser/node
// See https://socket.io/docs/emit-cheatsheet/ for list of words that should not be used
const MSG_TYPES = {
    CONNECT: "client connection",
    GAME_START: "game start",
    SERVER_UPDATE_GAME_STATE: "server update game state",
    SERVER_UPDATE_GAME_BOARD: "server update game board",
    CLIENT_UPDATE: "client update",
    CLIENT_UPDATE_GAME_BOARD: "client update game board",
    CLIENT_UPDATE_GAME_BOARD_CONFIRM: "client update set game board",
    NEW_GAME: "ng"
}

const socket = io();
startRenderingMenu();

socket.on(MSG_TYPES.SERVER_UPDATE_GAME_BOARD, (grid, rows, cols, subGridSize) => {
    // grid is the simple representation of the map - a 2D array or arrays
    setGridDimsRowsCols(rows, cols);
    setSubGridDim(subGridSize);
    setBoard(grid);
    //printMap(grid);
});

socket.on(MSG_TYPES.GAME_START, (data) => {
    console.log("start rendering game")
    stopRenderingMenu()
    startRenderingGame();
});

socket.on(MSG_TYPES.SERVER_UPDATE_GAME_STATE, (data) => {
    setState(data);
    //console.log(data)
});

function sendMessage(msgType, data) {
    // TODO
    //  only send on change?
    //  only send during "player update" round
    let msg = {
        "gameID": getGameID(),
        "data": data
    }
    socket.emit(msgType, msg, function (response) {
        return true; // Only fires if get a successful response form the server
    })
    return false;
}

export { MSG_TYPES, sendMessage }