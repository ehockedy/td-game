import { setState, setBoard, setGridDimsRowsCols, setSubGridDim , getGameID } from "./state.js"
import { startRendering as startRenderingMenu, stopRendering as stopRenderingMenu} from "./views/menu_renderer.js"
import { GameRenderer} from "./views/game.js"

// To get client side debugging, paste "localStorage.debug = '*';" into
// the browser console

// MUST keep these synced with enum in server
// Shared file did not work due to inconsistency with import/require in browser/node
// See https://socket.io/docs/emit-cheatsheet/ for list of words that should not be used
export const MSG_TYPES = {
    CONNECT: "client connection",
    GAME_START: "game start",
    SERVER_UPDATE_GAME_STATE: "server update game state",
    SERVER_UPDATE_GAME_BOARD: "server update game board",
    CLIENT_UPDATE: "client update",
    CLIENT_UPDATE_GAME_BOARD: "client update game board",
    CLIENT_UPDATE_GAME_BOARD_CONFIRM: "client update set game board",
    NEW_GAME: "ng",
    JOIN_GAME: "jg",
    CHECK_GAME: "cg",
    CLIENT_DEBUG: "cd",
    ADD_PLAYER: "ap"
}

export function getTowerUpdateMsg(tower) {
    return {
        "y": tower.gridY,
        "x": tower.gridX,
        "value": {
            "type": tower.type,
            "playerID": tower.playerID,
            "colour": "0xCC2211",
            "name": tower.name
        },
        "towerName": tower.name,
        "gameID": getGameID()
    }
}

const socket = io();
startRenderingMenu();

let game;

socket.on(MSG_TYPES.SERVER_UPDATE_GAME_BOARD, (grid, rows, cols, subGridSize) => {
    // grid is the simple representation of the map - a 2D array of arrays
    setGridDimsRowsCols(rows, cols);
    setSubGridDim(subGridSize);
    setBoard(grid);
    //printMap(grid);
});

socket.on(MSG_TYPES.GAME_START, (data) => {
    console.log("start rendering game")
    stopRenderingMenu()
    game.startRendering()
});

socket.on(MSG_TYPES.SERVER_UPDATE_GAME_STATE, (data) => {
    setState(data);
    game.update(data)
});

socket.on(MSG_TYPES.ADD_PLAYER, (data) => {
    game.addPlayer(data)
})

export function sendNewGameMessage(data) {
    // load the assets into shared loader, then construct game view and send message to start
    game = new GameRenderer()
    game.loadAssets().then(()=>{
        sendMessage(MSG_TYPES.NEW_GAME, data)
    })
}

export function sendJoinGameMessage(data) {
    // load the assets into shared loader, then construct game view and send message to start
    console.log(data)
    game = new GameRenderer()
    game.loadAssets().then(()=>{
        sendMessage(MSG_TYPES.JOIN_GAME, data)
    })
}

export function sendMessage(msgType, data) {
    socket.emit(msgType, data)
}

export function sendMessageGetAck(msgType, data) {
    return new Promise((resolve, reject) => {
        let done = false
        socket.emit(msgType, data, function (response) {
            resolve(response)
            done = true
        })
        setTimeout(() => {
            if (done) return;
            else reject({
                response: "timeout"
            });
        }, 2000); // 2s
    })
}

export function sendResourceUpdateMessage(resourceType, name, propertyUpdateArray) {
    socket.emit(MSG_TYPES.CLIENT_UPDATE, {
        "gameID": getGameID(),
        "resource": resourceType,
        "name": name,
        "updates": propertyUpdateArray
    })
}
