import { ButtonHorizontalMenuOption } from "../../ui_common/horizontalMenuOption.js"
import { generateStyle } from "./deployedTowerMenu.js"

let startMenuColour = "0x40d661"
export class StartRoundButton extends ButtonHorizontalMenuOption {
    constructor(x, y) {
        super("startGameButton", x, y, 300, startMenuColour, "right")
        //this.setOffset(-20)

        //this.startGameRoot = this.addOption(300, startMenuColour, "start-round")
        //this.addChild(this.startGameRoot)

        let fontSize = 36
        this.gameRoundText = new PIXI.Text("" , generateStyle(startMenuColour, fontSize))
        this.gameRoundText.anchor.set(0, 0.5)
        this.addText(this.gameRoundText, 0.15, 0.5)
        this.update("1")  // Populate with expected text for round 1


        this.setSelectEventName("start-round")
    }

    update(roundNumberString) {
        // Not sure this is the final text I want here, might be better with a dedicated round box
        this.gameRoundText.text = "Start Round " + roundNumberString
    }

    // Override
    stopInteraction() {
        super.stopInteraction()
        let disabledTint = "0xAAAAAA"
        this.menuSprite.tint = disabledTint
        this.gameRoundText.style.fill = disabledTint
    }

    // Override
    startInteraction() {
        super.startInteraction()
        this.menuSprite.tint = startMenuColour
        this.gameRoundText.style.fill = startMenuColour
    }
}