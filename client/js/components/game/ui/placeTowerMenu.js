import { ButtonMenu } from "./horizontalOptionsMenu.js"
import { boldTextStyle, COLOURS } from "../../ui_common/style.js"

let buttonScale = 0.3
export class PlaceTowerMenu extends ButtonMenu {  // TODO make this not a buton menu, but a wrapper
    constructor(x, y) {
        super("placeTowerMenu", x, y, "right", -10)

        this.confirmButton = this.addOption(180, COLOURS.CONFIRM_GREEN, "confirmTowerPlace", false)
        this.confirmButton.addTextCentral("\u{1F5F8}" , boldTextStyle(COLOURS.BLACK))

        this.denyButton = this.addOption(180, COLOURS.DENY_RED, "denyTowerPlace", false)
        this.denyButton.addTextCentral("\u{2717}", boldTextStyle(COLOURS.BLACK))

        this.scale.set(buttonScale)
    }
}
