import { HorizontalOptionsMenu } from "./horizontalOptionsMenu.js"
import { generateStyle } from "./deployedTowerMenu.js"

let confirmButtonColour = "0x40d661"
let denyButtonColour = "0xd64061"
let buttonScale = 0.3
export class PlaceTowerMenu extends HorizontalOptionsMenu {
    constructor(x, y) {
        super("placeTowerMenu", x, y)
        this.setOffset(-10)

        this.confirmButton = this.addButtonOption(180, confirmButtonColour, generateStyle() , "\u{1F5F8}", "confirmTowerPlace")
        this.addChild(this.confirmButton)

        this.denyButton = this.addButtonOption(180, denyButtonColour, generateStyle() , "\u{2717}", "denyTowerPlace")
        this.addChild(this.denyButton)

        this.scale.set(buttonScale)
    }
}