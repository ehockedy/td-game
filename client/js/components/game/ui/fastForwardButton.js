import { ButtonHorizontalMenuOption } from "../../ui_common/horizontalMenuOption.js"
import { plainTextStyle, COLOURS } from "../../ui_common/style.js"

let startMenuColour = COLOURS.CONFIRM_GREEN
export class FastForwardButton extends ButtonHorizontalMenuOption {
    constructor(x, y) {
        super("fastForwardButton", x, y, 300, startMenuColour, "right")
        let fontSize = 30
        this.fastForwardText = "Fast Forward >>>"
        this.normalSpeedText = "Normal Speed >"
        this.buttonText = new PIXI.Text(this.fastForwardText , plainTextStyle(COLOURS.BLACK, fontSize))
        this.buttonText.anchor.set(0, 0.5)
        this.addText(this.buttonText, 0.15, 0.5)
        this.setSelectEventName("toggle-fast-forward")

        this.isFast = false
    }

    toggleFastForward() {
        this.isFast = !this.isFast
        this.buttonText.text = this.isFast ? this.normalSpeedText : this.fastForwardText
    }

    reset() {
        this.buttonText.text = this.fastForwardText
        this.isFast = false
    }
}