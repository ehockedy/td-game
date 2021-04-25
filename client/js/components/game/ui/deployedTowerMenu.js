import { SwitchMenu, ButtonMenu } from "./horizontalOptionsMenu.js"
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
        "letterSpacing": 1,
        "strokeThickness": Math.ceil(fontSize/10)
    }
}

let aimColour = "0xDD3333"
let upgradeColour = "0x229933"
let sellColour = "0xDDAA11"
let towerInfoColour = "0xAABB99"

class DeployedTowerMainMenu extends ButtonMenu {
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

        this.addCancelButton()
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

let aimRootWidth = 430
class DeployedTowerAimMenu extends SwitchMenu {
    constructor(x, y) {
        super("deployedTowerAimMenu", x, y, "right", -20)
        this.menuRoot = this.addRoot(aimRootWidth, "0xDDEECC")

        let optionWidth = 220
        let textStyle = generateStyle(aimColour, 44)

        // Aim at the emeny closest to the end of the track and in range
        this.firstOption = this.addOption(optionWidth, aimColour, "selected-aim-first", true)
        this.firstOption.addTextCentral("First", textStyle)

        // Aim at the enemy closest to the start of the track and in range
        this.lastOption = this.addOption(optionWidth, aimColour, "selected-aim-last", false)
        this.lastOption.addTextCentral("Last", textStyle)

        // Aim at the enemy closest to the tower and in range
        this.closestOption = this.addOption(optionWidth, aimColour, "selected-aim-closest", false)
        this.closestOption.addTextCentral("Closest", textStyle)

        // Aim at the enemy with the highest speed that is in range
        this.fastestOption = this.addOption(optionWidth, aimColour, "selected-aim-fastest", false)
        this.fastestOption.addTextCentral("Fastest", textStyle)

        this.addBackButton()
        this.addCancelButton()
        this.setRootInfo()
    }

    // Initialise the information displayed on the root menu component of the aim menu
    setRootInfo() {
        let fontSize = 26
        let style =  generateStyle(towerInfoColour, fontSize)
        style.wordWrap = true
        style.wordWrapWidth = aimRootWidth - 30
        style.fontVariant = "normal"

        this.nameAndLevel = new PIXI.Text("Aim sets how the tower selects which enemy to shoot", style)
        this.nameAndLevel.anchor.set(0, 0.5)
        this.menuRoot.addText(this.nameAndLevel, 0.02, 0.5)
    }

    // Update just the contents of the info created in populateWithTowerInfo to ensure kill stats is up to date
    updateTowerInfo(tower) {
        let newActiveButton
        switch(tower.aim) {
            case "first":
                newActiveButton = this.firstOption
                break
            case "last":
                newActiveButton = this.lastOption
                break
            case "fastest":
                newActiveButton = this.fastestOption
                break
            case "closest":
                newActiveButton = this.closestOption
                break
        }
        this.setSelected(newActiveButton)
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

        this.aimMenu = new DeployedTowerAimMenu(x, y)
        this.aimMenu.subscribe(this)
        this.addChild(this.aimMenu)

        this.setUpEventListeners()
    }

    setUpEventListeners() {
        // Transitions between different menus
        this.on("selected-aim", () => {
            this.mainMenu.visible = false
            this.aimMenu.visible = true
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

        // Aim behaviour chosen, emit update event with the currently selected tower and the desired aim behaviour update
        this.on("selected-aim-first", () => {
            this.observers.forEach((observer) => { observer.emit("update-tower", this.selectedTower, "aim", "aimBehaviour", "first") })
        })
        this.on("selected-aim-last", () => {
            this.observers.forEach((observer) => { observer.emit("update-tower", this.selectedTower, "aim", "aimBehaviour", "last") })
        })
        this.on("selected-aim-closest", () => {
            this.observers.forEach((observer) => { observer.emit("update-tower", this.selectedTower, "aim", "aimBehaviour", "closest") })
        })
        this.on("selected-aim-fastest", () => {
            this.observers.forEach((observer) => { observer.emit("update-tower", this.selectedTower, "aim", "aimBehaviour", "fastest") })
        })

        this.on("back", () => {
            this.show()
        })

        this.on("cancel", () => {
            this.observers.forEach((observer) => { observer.emit("clickOffDeployedTower", this.selectedTower) })
        })
    }

    updateTowerInfo(tower) {
        // Live updates of the towers state
        this.mainMenu.updateTowerInfo(tower)
    }

    setSelectedTower(tower) {
        // This is data to update once when the tower is clicked on
        this.selectedTower = tower
        this.aimMenu.updateTowerInfo(tower)
    }

    show() {
        super.show()
        this.children.forEach((child) => { child.visible = false })
        this.mainMenu.visible = true
    }

    hide() {
        super.hide()
        this.children.forEach((child) => { child.visible = false })
    }
}
