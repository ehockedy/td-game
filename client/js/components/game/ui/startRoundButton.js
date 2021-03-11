import { HorizontalOptionsMenu } from "./horizontalOptionsMenu.js"
import { generateStyle } from "./deployedTowerMenu.js"

let startMenuColour = "0x40d661"
export class StartRoundButton extends HorizontalOptionsMenu {
    constructor(x, y) {
        super("startGameButton", x, y)
        this.setOffset(-20)

        this.startGameRoot = this.addRightRootButton(300, startMenuColour, "start-round")
        this.addChild(this.startGameRoot)

        let fontSize = 38
        this.gameRoundText = new PIXI.Text("" , generateStyle(startMenuColour, fontSize))
        this.update("1")  // Populate with expected text for round 1

        // Add the text to the button
        this.startGameRoot.setTextCentral(this.gameRoundText, -20)
        this.gameRoundText.angle = 180
    }

    update(roundNumberString) {
        // Not sure this is the final text I want here, might be better with a dedicated round box
        this.gameRoundText.text = "Start Round " + roundNumberString
    }

    // Override
    stopInteraction() {
        this.startGameRoot.stopInteraction()

        let disabledTint = "0xAAAAAA"
        this.startGameRoot.setTint(disabledTint)
        this.gameRoundText.style.fill = disabledTint
    }

    // Override
    startInteraction() {
        this.startGameRoot.startInteraction()
        this.startGameRoot.setTint(startMenuColour)
        this.gameRoundText.style.fill = startMenuColour
    }
}