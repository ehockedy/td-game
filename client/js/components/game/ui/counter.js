import { StaticHorizontalMenuOption } from "../../ui_common/horizontalMenuOption.js"
import { boldTextStyle, COLOURS } from "../../ui_common/style.js"

export class Counter extends StaticHorizontalMenuOption {
    constructor(x, y, width, label, defaultValue, colour=COLOURS.INFO_MID_GREY) {
        super(label, x, y, width, colour, "right")

        this.label = new PIXI.Text(label, boldTextStyle(colour, 36))
        this.label.anchor.set(0.5)
        this.addText(this.label, 0.6, 0.25)

        this.value = new PIXI.Text("", boldTextStyle(colour, 48))
        this.value.anchor.set(0.5)
        this.addText(this.value, 0.6, 0.68)
        this.update(defaultValue)  // Populate with initial number
    }

    update(newValue) {
        this.value.text = newValue.toString()
    }
}
