import { StaticHorizontalMenuOption } from "../../ui_common/horizontalMenuOption.js"
import { generateStyle } from "./deployedTowerMenu.js"

const defaultColour = "0xAABB99"

export class Counter extends StaticHorizontalMenuOption {
    constructor(x, y, width, label, defaultValue, colour=defaultColour) {
        super(label, x, y, width, colour, "right")

        this.label = new PIXI.Text(label, generateStyle(colour, 30))
        this.label.anchor.set(0.5)
        this.addText(this.label, 0.6, 0.25)

        this.value = new PIXI.Text("", generateStyle(colour, 40))
        this.value.anchor.set(0.5)
        this.addText(this.value, 0.6, 0.68)
        this.update(defaultValue)  // Populate with initial number
    }

    update(newValue) {
        this.value.text = newValue.toString()
    }
}
