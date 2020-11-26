import { setState, setBoard, setGridDimsRowsCols, setSubGridDim , getGameID, setUserID } from "./state.js"
import { GameRenderer} from "./views/game.js"
import { MainMenuRenderer } from "./views/main_menu.js"
import { LobbyRenderer } from "./views/lobby.js"

// To get client side debugging, paste "localStorage.debug = '*';" into
// the browser console

// MUST keep these synced with enum in server
// Shared file did not work due to inconsistency with import/require in browser/node
// See https://socket.io/docs/emit-cheatsheet/ for list of words that should not be used
export const MSG_TYPES = {
    CONNECT: "client connection",
    GAME_START: "game start",
    GAME_START_REQUEST: "gsr",
    GET_MAP: "gm",
    SERVER_UPDATE_GAME_STATE: "server update game state",
    SERVER_UPDATE_GAME_BOARD: "server update game board",
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
    REMOVE_PLAYER: "rp"
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

export function addSocketEvent(messageType, callback) {
    socket.on(messageType, callback)
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
