import { BaseMenuOptionComponent } from "./base/baseMenuOptionComponent.js"
import { setGameID } from "../../state.js"
import { randomAlphaCharString } from "../../tools.js"

export class NewGameComponent extends BaseMenuOptionComponent {
    constructor(socket, x, y, gameCodeLen) {
        super("newGame", x, y, "New Game")

        function onStartButtonClick() {
            let gameID = randomAlphaCharString(gameCodeLen)
            let data = {
                "gameID": gameID
            }
            setGameID(gameID)
            socket.emit("server/session/join", data)  // TODO have main menu subscribe and pass an event up - do not send the message here
        }

        this.textSprite
            .on("click", onStartButtonClick)
            .on("tap", onStartButtonClick)
            .on("pointerover", this.onButtonHover)
            .on("pointerout", this.onButtonStopHover)
    }
}