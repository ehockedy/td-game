import { StaticHorizontalMenuOption } from "../../ui_common/horizontalMenuOption.js"
import { boldTextStyle, plainTextStyle, COLOURS } from "../../ui_common/style.js"

export class PlayerPointCounter extends StaticHorizontalMenuOption {
    constructor(x, y, width, label, defaultValue, colour=COLOURS.INFO_MID_GREY) {
        super(label, x, y, width, colour, "right-flipped")

        this.label = new PIXI.Text(label, plainTextStyle(COLOURS.BLACK, 36))
        this.label.anchor.set(0.5)
        this.addText(this.label, 0.6, 0.25)

        this.value = new PIXI.Text("", plainTextStyle(COLOURS.BLACK, 30))
        this.value.anchor.set(0, 0.5)
        this.addText(this.value, 0.8, 0.62)
        this.update(defaultValue)  // Populate with initial number
    }

    update(newValue) {
        if (!(this.value.text === newValue.toString())) {
            this.value.text = newValue.toString()
        }
    }
}