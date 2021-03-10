import { HorizontalOptionsMenu } from "./horizontalOptionsMenu.js"
import { getPositionWithinEquallySpacedObjects } from "../../../tools.js"
import { BaseComponent } from "../base/baseComponent.js"

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

let aimColour = "0xDD3333"
let upgradeColour = "0x229933"
let sellColour = "0xDDAA11"

export class DeployedTowerMainMenu extends HorizontalOptionsMenu {
    constructor(x, y) {
        super("deployedTowerMainMenu", x, y)
        this.setOffset(-20)

        // TODO add addRoot option
        this.menuRoot = this.addRoot(350, "0xDDEECC")
        this.addChild(this.menuRoot)

        // Select this option to open the aiming menu
        this.aimOption = this.addButtonOption(260, aimColour, generateStyle(aimColour), "Aim", "selected-aim")
        this.addChild(this.aimOption)

        // Select this option to open the upgrades menu
        this.upgradeOption = this.addButtonOption(260, upgradeColour, generateStyle(upgradeColour), "Upgrade", "selected-upgrade")
        this.addChild(this.upgradeOption)

        // Select this option to open the selling menu
        this.sellOption = this.addButtonOption(260, sellColour, generateStyle(sellColour), "Sell", "selected-sell")
        this.addChild(this.sellOption)

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

// This manages the transitions between the menus within the tower menu, and if a selection is made that afects the game, it emits
// an event to its subscribers.
export class DeployedTowerMenu extends BaseComponent {
    constructor(x, y) {
        super("DeployedTowerMenu")
        this.mainMenu = new DeployedTowerMainMenu(x, y)
        this.mainMenu.subscribe(this)
        this.addChild(this.mainMenu)
        console.log(this.mainMenu)
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
