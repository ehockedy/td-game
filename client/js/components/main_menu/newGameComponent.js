import { BaseMenuOptionComponent } from "./base/baseMenuOptionComponent.js"
import { setGameID } from "../../state.js"
import { GAME_CODE_LEN } from "../../constants.js"
import { sendMessage, MSG_TYPES } from "../../networking.js"
import { randomAlphaCharString } from "../../tools.js"

export class NewGameComponent extends BaseMenuOptionComponent {
    constructor(x, y) {
        super("newGame", x, y, "New Game")
        this.textSprite
            .on("click", this.onStartButtonClick)
            .on("tap", this.onStartButtonClick)
            .on("pointerover", this.onButtonHover)
            .on("pointerout", this.onButtonStopHover)
    }

    onStartButtonClick() {
        let gameID = randomAlphaCharString(GAME_CODE_LEN)
        let data = {
            "gameID": gameID
        }
        setGameID(gameID)
        sendMessage(MSG_TYPES.JOIN_GAME, data)
    }
}