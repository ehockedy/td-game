import { SwitchMenu, ButtonMenu } from "./horizontalOptionsMenu.js"
import { getPositionWithinEquallySpacedObjects } from "../../../tools.js"
import { BaseComponent } from "../base/baseComponent.js"

// TODO move this to a styles section
export function generateStyle(tint, fontSize=48) {
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

let aimColour = "0xDD3333"
let upgradeColour = "0x229933"
let sellColour = "0xDDAA11"
let towerInfoColour = "0xAABB99"

export class DeployedTowerMainMenu extends ButtonMenu {
    constructor(x, y) {
        super("deployedTowerMainMenu", x, y, "right", -20)

        this.menuRoot = this.addRoot(350, "0xDDEECC")

        // Select this option to open the aiming menu
        this.aimOption = this.addOption(260, aimColour, "selected-aim")
        this.aimOption.addTextCentral("Aim", generateStyle(aimColour))

        // Select this option to open the upgrades menu
        this.upgradeOption = this.addOption(260, upgradeColour, "selected-upgrade")
        this.upgradeOption.addTextCentral("Upgrade", generateStyle(upgradeColour))

        // Select this option to open the selling menu
        this.sellOption = this.addOption(260, sellColour, "selected-sell")
        this.sellOption.addTextCentral("Sell", generateStyle(sellColour))

        this.populateWithTowerInfo()
    }

    // Initialise the information displayed on the deployed tower menu
    populateWithTowerInfo() {
        // Fill the menu to have info relevant to the specified tower
        let fontSize = 28
        this.nameAndLevel = new PIXI.Text("", generateStyle(towerInfoColour, fontSize))
        this.nameAndLevel.anchor.set(0, 0.5)
        this.menuRoot.addText(this.nameAndLevel, 0.02, 0.33)

        this.kills = new PIXI.Text("", generateStyle(towerInfoColour, fontSize))
        this.kills.anchor.set(0, 0.5)
        this.menuRoot.addText(this.kills, 0.02, 0.66)
    }

    // Update just the contents of the info created in populateWithTowerInfo to ensure kill stats is up to date
    updateTowerInfo(tower) {
        this.nameAndLevel.text = "Level " + tower.level + " " + tower.type
        this.kills.text = "Kills: " + tower.stats.kills
    }
}

// This manages the transitions between the menus within the tower menu, and if a selection is made that afects the game, it emits
// an event to its subscribers.
export class DeployedTowerMenu extends BaseComponent {
    constructor(x, y) {
        super("DeployedTowerMenu")
        this.mainMenu = new DeployedTowerMainMenu(x, y)
        this.mainMenu.subscribe(this)
        this.addChild(this.mainMenu)
        this.setUpEventListeners()
    }

    setUpEventListeners() {
        this.on("selected-aim", () => {
            //this.mainMenu.visible = false
            //this.aimMenu.visible = true
            console.log("Aim selected")
        })

        this.on("selected-upgrade", () => {
            //this.mainMenu.visible = false
            //this.aimMenu.visible = true
            console.log("Upgrade selected")
        })

        this.on("selected-sell", () => {
            //this.mainMenu.visible = false
            //this.aimMenu.visible = true
            console.log("Sell selected")
        })
    }

    updateTowerInfo(tower) {
        this.mainMenu.updateTowerInfo(tower)
    }

    show() {
        super.show()
        this.mainMenu.visible = true
    }

    hide() {
        super.hide()
        this.mainMenu.visible = false
    }
}
