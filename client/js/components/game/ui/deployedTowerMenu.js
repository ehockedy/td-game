import { HorizontalOptionsMenu } from "./horizontalOptionsMenu.js"

function generateStyle(tint) {
    return {
        "dropShadow": true,
        "dropShadowAngle": 0.7,
        "fill": tint,
        "fontFamily": "\"Trebuchet MS\", Helvetica, sans-serif",
        "fontSize": 48,
        "fontStyle": "italic",
        "fontVariant": "small-caps",
        "strokeThickness": 3
    }
}

export class DeployedTowerMainMenu extends HorizontalOptionsMenu {
    constructor(x, y) {
        super("deployedTowerMainMenu", x, y, 250, "0xDDEECC")
        this.setOffset(-20)
        this.aimOption = this.addOption(280, "0xDD3333")
        this.upgradeOption = this.addOption(280, "0x229933")
        this.sellOption = this.addOption(280, "0xDDAA11")

        let aimContent = new PIXI.Text("Aim", generateStyle("0xDD3333"))
        aimContent.x = this.aimOption.width/2
        this.aimOption.setContent(aimContent)

        let upgradeContent = new PIXI.Text("Upgrade", generateStyle("0x229933"))
        upgradeContent.x = this.upgradeOption.width/2
        this.upgradeOption.setContent(upgradeContent)

        let sellContent = new PIXI.Text("Sell", generateStyle("0xDDAA11"))
        sellContent.x = this.sellOption.width/2
        this.sellOption.setContent(sellContent)
    }
}
