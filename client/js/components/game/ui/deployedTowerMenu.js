import { SwitchMenu, ButtonMenu } from "./horizontalOptionsMenu.js"
import { BaseComponent } from "../base/baseComponent.js"
import { boldTextStyle, plainTextStyle, COLOURS } from "../../ui_common/style.js"

const buttonFontSize = 40

class DeployedTowerMainMenu extends ButtonMenu {
    constructor(x, y) {
        super("deployedTowerMainMenu", x, y, "right", -20)

        this.menuRoot = this.addRoot(350, COLOURS.INFO_LIGHT_GREY)

        // Select this option to open the aiming menu
        this.aimOption = this.addOption(260, COLOURS.AIM_RED, "selected-aim")
        this.aimOption.addTextCentral("AIM", boldTextStyle(COLOURS.AIM_RED, buttonFontSize))

        // Select this option to open the upgrades menu
        this.upgradeOption = this.addOption(260, COLOURS.UPGRADE_GREEN, "selected-upgrade")
        this.upgradeOption.addTextCentral("UPGRADE", boldTextStyle(COLOURS.UPGRADE_GREEN, buttonFontSize))

        // Select this option to open the selling menu
        this.sellOption = this.addOption(260, COLOURS.MONEY, "selected-sell")
        this.sellOption.addTextCentral("SELL", boldTextStyle(COLOURS.MONEY, buttonFontSize))

        this.addCancelButton()
        this.populateWithTowerInfo()
    }

    // Initialise the information displayed on the deployed tower menu
    populateWithTowerInfo() {
        // Fill the menu to have info relevant to the specified tower
        let fontSize = 30
        this.nameAndLevel = new PIXI.Text("", plainTextStyle(COLOURS.BLACK, fontSize))
        this.nameAndLevel.anchor.set(0, 0.5)
        this.menuRoot.addText(this.nameAndLevel, 0.02, 0.33)

        this.kills = new PIXI.Text("", plainTextStyle(COLOURS.BLACK, fontSize))
        this.kills.anchor.set(0, 0.5)
        this.menuRoot.addText(this.kills, 0.02, 0.66)
    }

    // Update just the contents of the info created in populateWithTowerInfo to ensure kill stats is up to date
    updateTowerInfo(tower) {
        this.nameAndLevel.text = "Level " + tower.level + " " + tower.type
        this.kills.text = "Kills: " + tower.stats.kills
    }
}

let aimRootWidth = 400
class DeployedTowerAimMenu extends SwitchMenu {
    constructor(x, y) {
        super("deployedTowerAimMenu", x, y, "right", -20)
        this.menuRoot = this.addRoot(aimRootWidth, COLOURS.INFO_LIGHT_GREY)

        const optionWidth = 190
        const fontSize = 36
        let textStyle = boldTextStyle(COLOURS.AIM_RED, fontSize)

        // Aim at the emeny closest to the end of the track and in range
        this.firstOption = this.addOption(optionWidth, COLOURS.AIM_RED, "selected-aim-first", true)
        this.firstOption.addTextCentral("FIRST", textStyle)

        // Aim at the enemy closest to the start of the track and in range
        this.lastOption = this.addOption(optionWidth, COLOURS.AIM_RED, "selected-aim-last", false)
        this.lastOption.addTextCentral("LAST", textStyle)

        // Aim at the enemy closest to the tower and in range
        this.closestOption = this.addOption(optionWidth, COLOURS.AIM_RED, "selected-aim-closest", false)
        this.closestOption.addTextCentral("CLOSE", textStyle)

        // Aim at the enemy with the highest speed that is in range
        this.fastestOption = this.addOption(optionWidth, COLOURS.AIM_RED, "selected-aim-fastest", false)
        this.fastestOption.addTextCentral("FAST", textStyle)

        this.addBackAndCancelButtons()
        this.setRootInfo()
    }

    // Initialise the information displayed on the root menu component of the aim menu
    setRootInfo() {
        let fontSize = 30
        let style =  plainTextStyle(COLOURS.BLACK, fontSize)
        style.wordWrap = true
        style.wordWrapWidth = aimRootWidth - 10

        this.aimDescription = new PIXI.Text("Aim determines which enemy the tower will shoot", style)
        this.aimDescription.anchor.set(0, 0.5)
        this.menuRoot.addText(this.aimDescription, 0.02, 0.5)
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

class DeployedTowerSellMenu extends ButtonMenu {
    constructor(x, y) {
        super("deployedTowerSellMenu", x, y, "right", -20)

        this.menuRoot = this.addRoot(350, COLOURS.INFO_LIGHT_GREY)

        // Confirm the selling of the tower in exchange for the displayed amount of money
        this.yesOption = this.addOption(260, COLOURS.MONEY, "selected-sell-yes")
        this.yesOption.addTextCentral("CONFIRM", boldTextStyle(COLOURS.MONEY, 42))

        this.addBackAndCancelButtons()
        this.populateWithTowerInfo()
    }

    // Initialise the information displayed on the deployed tower menu
    populateWithTowerInfo() {
        // Fill the menu to have info relevant to the specified tower
        let fontSize = 40
        this.sellPriceText = new PIXI.Text("", plainTextStyle(COLOURS.BLACK, fontSize))
        this.sellPriceText.anchor.set(0, 0.5)
        this.menuRoot.addText(this.sellPriceText, 0.02, 0.5)
    }

    // Update just the contents of the info created in populateWithTowerInfo to ensure kill stats is up to date
    updateTowerInfo(tower) {
        this.sellPriceText.text = "Sell price:  " + tower.sellPrice.toString()
    }
}

class DeployedTowerUpgradeMenu extends ButtonMenu {
    constructor(x, y) {
        super("deployedTowerUpgradeMenu", x, y, "right", -20)

        this.menuRoot = this.addRoot(420, COLOURS.INFO_LIGHT_GREY)
        const defaultMenuRootText = "Available upgrades"
        let menuRootText = new PIXI.Text(defaultMenuRootText, plainTextStyle(COLOURS.BLACK, 32))
        menuRootText.anchor.set(0, 0.5)
        this.menuRoot.addText(menuRootText, 0.02, 0.5)

        const numberOfUpgrades = 3
        const width = 250
        this.options = []
        for (let optIdx = 0; optIdx < numberOfUpgrades; optIdx += 1) {
            let upgradeOption = this.addOption(width, COLOURS.UPGRADE_GREEN, "selected-upgrade-option")
            let style = plainTextStyle(COLOURS.BLACK, 32)
            style.wordWrap = true
            style.wordWrapWidth = width - 20
            upgradeOption.addTextCentral("", style)
            upgradeOption.altText = defaultMenuRootText  // Text to be displayed on the menu root when hovered over

            // Add hover behaviour
            upgradeOption.addInteractionEvent("mouseover", () => {
                this.menuRoot.updateText(upgradeOption.altText)
            })
            upgradeOption.addInteractionEvent("mouseout", () => {
                this.menuRoot.updateText(defaultMenuRootText)
            })
            this.options.push(upgradeOption)
        }

        this.addBackAndCancelButtons()
    }

    updateTowerInfo(upgradeState, playerMoney) {
        let upgradeIdx = 0
        for (const [upgradeType, {description, description_long, cost, purchased}] of Object.entries(upgradeState)) {
            let option = this.options[upgradeIdx]
            option.updateText(description.toUpperCase())
            option.setParams({
                "type": upgradeType
            })
            option.altText = 
                `${description_long}\nCost: ${purchased ? "PURCHASED" : cost}`
            if (purchased || playerMoney < cost) {
                option.disableClick()
            } else {
                option.enableClick()
            }
            upgradeIdx += 1
        }
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

        this.sellMenu = new DeployedTowerSellMenu(x, y)
        this.sellMenu.subscribe(this)
        this.addChild(this.sellMenu)

        this.upgradeMenu = new DeployedTowerUpgradeMenu(x, y)
        this.upgradeMenu.subscribe(this)
        this.addChild(this.upgradeMenu)

        this.setUpEventListeners()
    }

    setUpEventListeners() {
        // Transitions between different menus
        this.on("selected-aim", () => {
            this.mainMenu.visible = false
            this.aimMenu.visible = true
            this.sellMenu.visible = false
            this.upgradeMenu.visible = false
        })

        this.on("selected-upgrade", () => {
            this.mainMenu.visible = false
            this.aimMenu.visible = false
            this.sellMenu.visible = false
            this.upgradeMenu.visible = true
        })

        this.on("selected-sell", () => {
            this.mainMenu.visible = false
            this.aimMenu.visible = false
            this.sellMenu.visible = true
            this.upgradeMenu.visible = false
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

        this.on("selected-sell-yes", () => {
            this.observers.forEach((observer) => { observer.emit("sell-tower", this.selectedTower, "sell") })
            this.emit("cancel")  // Tower no longer available, so close its menu
        })

        this.on("selected-upgrade-option", (params) => {
            this.observers.forEach((observer) => { observer.emit("upgrade-tower", this.selectedTower, "upgrade", params.type) })
        })

        this.on("back", () => {
            this.show()
        })

        this.on("cancel", () => {
            this.observers.forEach((observer) => { observer.emit("clickOffDeployedTower", this.selectedTower) })
            this.selectedTower = undefined
        })
    }

    updateTowerInfo(towerUpdate, activeTower, playerMoney) {
        // Live updates of the towers state
        this.mainMenu.updateTowerInfo(towerUpdate)
        this.sellMenu.updateTowerInfo(towerUpdate)
        this.upgradeMenu.updateTowerInfo(activeTower.getUpgradeState(), playerMoney)
    }

    setSelectedTower(tower) {
        // This is data to update once when the tower is clicked on
        this.selectedTower = tower
        this.aimMenu.updateTowerInfo(tower)
        //this.upgradeMenu.updateTowerInfo(tower)
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
