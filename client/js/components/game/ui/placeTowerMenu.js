import { ButtonMenu } from "./horizontalOptionsMenu.js"
import { plainTextStyle, COLOURS } from "../../ui_common/style.js"

export class PlaceTowerMenu extends ButtonMenu {  // TODO make this not a buton menu, but a wrapper
    constructor(x, y) {
        super("placeTowerMenu", x, y, "right", 5)

        this.towerInfo = this.addStaticOption(640, COLOURS.INFO_LIGHT_GREY, true)
        const infoStyle = plainTextStyle(COLOURS.BLACK, 30)
        this.towerInfo.addText(new PIXI.Text('', infoStyle), 0.07, 0.0, 'name')
        this.towerInfo.addText(new PIXI.Text('', infoStyle), 0.07, 0.45, 'description')

        const buttonWidth = 180
        this.confirmButton = this.addOption(340, COLOURS.CONFIRM_GREEN, "confirmTowerPlace", false)
        this.confirmButton.addTextCentral("Buy for" , plainTextStyle(COLOURS.BLACK, 40))

        this.denyButton = this.addOption(buttonWidth, COLOURS.DENY_RED, "denyTowerPlace", true)
        this.denyButton.addTextCentral("Cancel", plainTextStyle(COLOURS.BLACK, 40))
        this.denyButton.x -= 10

        this.initialY = Math.round(this.towerInfo.height / 2) - 4 // -4 for shadow
        // anchor to centre of y
        this.resetYPosition()
    }

    updateTowerInfo(description, cost, name) {
        this.towerInfo.updateTextByName('description', description)
        this.towerInfo.updateTextByName('name', name)
        this.confirmButton.updateText(`Buy for ${cost}`)
    }

    resetYPosition() {
        this.y = -this.initialY
    }
}
