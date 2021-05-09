import { ButtonHorizontalMenuOption } from "../../ui_common/horizontalMenuOption.js"
import { boldTextStyle, COLOURS } from "../../ui_common/style.js"

let startMenuColour = COLOURS.CONFIRM_GREEN
export class StartRoundButton extends ButtonHorizontalMenuOption {
    constructor(x, y) {
        super("startGameButton", x, y, 300, startMenuColour, "right")
        let fontSize = 50
        this.gameRoundText = new PIXI.Text("" , boldTextStyle(startMenuColour, fontSize))
        this.gameRoundText.anchor.set(0, 0.5)
        this.addText(this.gameRoundText, 0.2, 0.5)
        this.update("1")  // Populate with expected text for round 1

        this.setSelectEventName("start-round")
    }

    update(roundNumberString) {
        // Not sure this is the final text I want here, might be better with a dedicated round box
        this.gameRoundText.text = "Start Round " + roundNumberString
    }

    // Override
    stopInteraction() {
        this.menuSprite.interactive = false
        this.menuSprite.buttonMode = false
        let disabledTint = "0xAAAAAA"
        this.menuSprite.tint = disabledTint
        this.gameRoundText.style.fill = disabledTint
    }

    // Override
    startInteraction() {
        this.menuSprite.interactive = true
        this.menuSprite.buttonMode = true
        this.menuSprite.tint = startMenuColour
        this.gameRoundText.style.fill = startMenuColour
    }
}