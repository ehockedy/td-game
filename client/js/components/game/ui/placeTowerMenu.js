import { ButtonMenu } from "./horizontalOptionsMenu.js"
import { generateStyle } from "./deployedTowerMenu.js"

let confirmButtonColour = "0x40d661"
let denyButtonColour = "0xd64061"
let buttonTextColour = "0x000000"
let buttonScale = 0.3
export class PlaceTowerMenu extends ButtonMenu {  // TODO make this not a buton menu, but a wrapper
    constructor(x, y) {
        super("placeTowerMenu", x, y, "right", -10)

        this.confirmButton = this.addOption(180, confirmButtonColour, "confirmTowerPlace")
        this.confirmButton.addTextCentral("\u{1F5F8}" , generateStyle(buttonTextColour))

        this.denyButton = this.addOption(180, denyButtonColour, "denyTowerPlace")
        this.denyButton.addTextCentral("\u{2717}", generateStyle(buttonTextColour))

        this.scale.set(buttonScale)
    }
}
