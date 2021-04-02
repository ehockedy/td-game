import { BaseMenuOptionComponent } from "./base/baseMenuOptionComponent.js"
import { setGameID } from "../../state.js"
import { sendMessage } from "../../networking.js"
import { randomAlphaCharString } from "../../tools.js"

export class NewGameComponent extends BaseMenuOptionComponent {
    constructor(x, y, gameCodeLen) {
        super("newGame", x, y, "New Game")

        function onStartButtonClick() {
            let gameID = randomAlphaCharString(gameCodeLen)
            let data = {
                "gameID": gameID
            }
            setGameID(gameID)
            sendMessage("server/session/join", data)
        }

        this.textSprite
            .on("click", onStartButtonClick)
            .on("tap", onStartButtonClick)
            .on("pointerover", this.onButtonHover)
            .on("pointerout", this.onButtonStopHover)
    }
}