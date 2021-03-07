import { HorizontalOptionsMenu } from "./horizontalOptionsMenu.js"
import { getPositionWithinEquallySpacedObjects } from "../../../tools.js"

function generateStyle(tint, fontSize=48) {
    return {
        "dropShadow": false,
        "dropShadowAngle": 0.7,
        "fill": tint,
        "fontFamily": "\"Trebuchet MS\", Helvetica, sans-serif",
        "fontSize": fontSize,
        "fontStyle": "normal",
        "fontVariant": "small-caps",
        "strokeThickness": Math.ceil(fontSize/10)
    }
}

export class DeployedTowerMainMenu extends HorizontalOptionsMenu {
    constructor(x, y) {
        super("deployedTowerMainMenu", x, y, 350, "0xDDEECC")
        this.setOffset(-20)
        this.aimOption = this.addOption(260, "0xDD3333")
        this.upgradeOption = this.addOption(260, "0x229933")
        this.sellOption = this.addOption(260, "0xDDAA11")

        let aimContent = new PIXI.Text("Aim", generateStyle("0xDD3333"))
        this.aimOption.setTextCentral(aimContent)

        let upgradeContent = new PIXI.Text("Upgrade", generateStyle("0x229933"))
        this.upgradeOption.setTextCentral(upgradeContent)

        let sellContent = new PIXI.Text("Sell", generateStyle("0xDDAA11"))
        this.sellOption.setTextCentral(sellContent)

        this.populateWithTowerInfo()
    }

    // Initialise the information displayed on the deployed tower menu
    populateWithTowerInfo() {
        // Fill the menu to have info relevant to the specified tower
        let fontSize = 28
        let towerInfoTextContainer = new PIXI.Container()
        this.nameAndLevel = new PIXI.Text("", generateStyle("0xAABB99", fontSize))
        this.kills = new PIXI.Text("", generateStyle("0xAABB99", fontSize))

        towerInfoTextContainer.addChild(this.nameAndLevel)
        towerInfoTextContainer.addChild(this.kills)

        let padding = 10
        towerInfoTextContainer.children.forEach((child, idx) => {
            child.anchor.set(0, 0.5)
            child.x = padding
            child.y = getPositionWithinEquallySpacedObjects(idx+1, towerInfoTextContainer.children.length, child.height, this.menuRoot.height - padding)
        })

        this.menuRoot.setContent(towerInfoTextContainer)
    }

    // Update just the contents of the info created in populateWithTowerInfo to ensure kill stats is up to date
    updateTowerInfo(tower) {
        this.nameAndLevel.text = "Level " + tower.level + " " + tower.type
        this.kills.text = "Kills: " + tower.stats.kills
    }
}
