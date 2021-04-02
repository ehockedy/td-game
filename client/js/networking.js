import { getGameID } from "./state.js"

// To get client side debugging, paste "localStorage.debug = '*';" into
// the browser console

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
    socket.emit("server/tower/update", {
        "gameID": getGameID(),
        "resource": resourceType,
        "name": name,
        "updates": propertyUpdateArray
    })
}
