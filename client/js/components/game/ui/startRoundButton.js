import { ButtonHorizontalMenuOption } from "../../ui_common/horizontalMenuOption.js"
import { plainTextStyle, COLOURS } from "../../ui_common/style.js"

let startMenuColour = COLOURS.CONFIRM_GREEN
export class StartRoundButton extends ButtonHorizontalMenuOption {
    constructor(x, y) {
        super("startGameButton", x, y, 300, startMenuColour, "right")
        let fontSize = 42
        this.gameRoundText = new PIXI.Text("I'M READY!" , plainTextStyle(COLOURS.BLACK, fontSize))
        this.gameRoundText.anchor.set(0, 0.5)
        this.addText(this.gameRoundText, 0.15, 0.5)

        this.setSelectEventName("start-round")
        this.clickable = true
    }

    // Override
    stopInteraction() {
        this.menuSprite.interactive = false
        this.menuSprite.buttonMode = false
        let disabledTint = "0xAAAAAA"
        this.menuSprite.tint = disabledTint
        this.clickable = false
    }

    // Override
    startInteraction() {
        this.menuSprite.interactive = true
        this.menuSprite.buttonMode = true
        this.menuSprite.tint = startMenuColour
        this.clickable = true
    }

    isClickable() {
        return this.clickable
    }
}