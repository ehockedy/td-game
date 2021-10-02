import { StaticHorizontalMenuOption } from "../../ui_common/horizontalMenuOption.js"
import { boldTextStyle, plainTextStyle, COLOURS } from "../../ui_common/style.js"

export class RoundCounter extends StaticHorizontalMenuOption {
    constructor(x, y, width, defaultValue, maxRounds, colour=COLOURS.INFO_MID_GREY) {
        super("Round", x, y, width, colour, "right")
        this.maxRounds = maxRounds
        this.currentRound = 0

        this.label = new PIXI.Text("Round", plainTextStyle(COLOURS.BLACK, 36))
        this.label.anchor.set(0.5)
        this.addText(this.label, 0.6, 0.25)

        this.value = new PIXI.Text("", plainTextStyle(COLOURS.BLACK, 42))
        this.value.anchor.set(0.5)
        this.addText(this.value, 0.6, 0.62)
        this.update(defaultValue)  // Populate with initial number
    }

    update(roundNumber) {
        if (this.currentRound != roundNumber && !isNaN(roundNumber)) {
            this.value.text = roundNumber.toString() + "/" + this.maxRounds.toString()
        }
    }
}