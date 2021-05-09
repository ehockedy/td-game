import { ButtonMenu } from "./horizontalOptionsMenu.js"
import { generateStyle, COLOURS } from "../../ui_common/style.js"

let buttonScale = 0.3
export class PlaceTowerMenu extends ButtonMenu {  // TODO make this not a buton menu, but a wrapper
    constructor(x, y) {
        super("placeTowerMenu", x, y, "right", -10)

        this.confirmButton = this.addOption(180, COLOURS.CONFIRM_GREEN, "confirmTowerPlace")
        this.confirmButton.addTextCentral("\u{1F5F8}" , generateStyle(COLOURS.BLACK))

        this.denyButton = this.addOption(180, COLOURS.DENY_RED, "denyTowerPlace")
        this.denyButton.addTextCentral("\u{2717}", generateStyle(COLOURS.BLACK))

        this.scale.set(buttonScale)
    }
}
