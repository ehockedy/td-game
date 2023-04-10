import { BigSwitchMenu, ButtonMenu, BigButtonMenu } from "./horizontalOptionsMenu.js"
import { BaseComponent } from "../base/baseComponent.js"
import { boldTextStyle, plainTextStyle, COLOURS } from "../../ui_common/style.js"

const buttonFontSize = 40
const optionButtonWidth = 260

class DeployedTowerMainMenu extends ButtonMenu {
    constructor(x, y, parentEventHandler) {
        super("deployedTowerMainMenu", x, y, "right", -20)

        this.menuRoot = this.addRoot(350, COLOURS.INFO_LIGHT_GREY)

        // Select this option to open the aiming menu
        const aimOption = this.addOption(optionButtonWidth, COLOURS.AIM_RED, "selected-aim")
        aimOption.addTextCentral("AIM", boldTextStyle(COLOURS.AIM_RED, buttonFontSize))

        // Select this option to open the upgrades menu
        const upgradeOption = this.addOption(optionButtonWidth, COLOURS.UPGRADE_GREEN, "selected-upgrade")
        upgradeOption.addTextCentral("UPGRADE", boldTextStyle(COLOURS.UPGRADE_GREEN, buttonFontSize))

        // Select this option to open the selling menu
        const sellOption = this.addOption(optionButtonWidth, COLOURS.MONEY, "selected-sell")
        sellOption.addTextCentral("SELL", boldTextStyle(COLOURS.MONEY, buttonFontSize))

        this.options = new Map([
            ['aim', aimOption],
            ['upgrade', upgradeOption],
            ['sell', sellOption]
        ])

        this.cancel = this.addCancelButton()
        this.populateWithTowerInfo()

        // Sub Menus
        const upgradeSubMenu = new DeployedTowerUpgradeOptionsMenu(0, 0)
        const aimSubMenu = new DeployedTowerAimMenu(0, 0)
        const sellSubMenu = new DeployedTowerSellMenu(20, 0)

        this.subMenus = new Map([
            ['aim', aimSubMenu],
            ['upgrade', upgradeSubMenu],
            ['sell', sellSubMenu]
        ])

        // Set up all sub menus
        for (let [subMenuType, subMenu] of this.subMenus) {
            this.addChild(subMenu)
            subMenu.visible = false

            // Center above the option horizontally
            const subMenuParent = this.options.get(subMenuType)
            subMenu.x += subMenuParent.x + (subMenuParent.width/2) - (subMenu.width / 2)
            subMenu.y += subMenuParent.y - (subMenu.height + 10)

            if (parentEventHandler) {
                subMenu.subscribe(parentEventHandler)
            }
        }

        // Add click interaction to hide all other sub menus and show the selected
        for (let [optionType, option] of this.options) {
            option.addInteractionEvent('pointerdown', () => {
                for (let [subMenuType, subMenu] of this.subMenus) {
                    subMenu.visible = optionType === subMenuType
                }
            })
        }
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
    updateTowerInfo(towerUpdate, activeTower, playerMoney) {
        this.nameAndLevel.text = "Level " + towerUpdate.level + " " + towerUpdate.type
        this.kills.text = "Kills: " + towerUpdate.stats.kills

        this.subMenus.get('aim').updateTowerInfo(activeTower)
        this.subMenus.get('upgrade').updateTowerInfo(activeTower.getUpgradeState(), activeTower.type, playerMoney)
        this.subMenus.get('sell').updateTowerInfo(towerUpdate)
    }

    close() {
        for (let menuObject of this.subMenus.values()) {
            menuObject.visible = false
        }
        this.visible = false
    }
}

function createAimOptionText(option, titleText, descriptionText, optionName) {
    let textStyleTitle = plainTextStyle(COLOURS.BLACK, 44)
    let textStyleDesc = plainTextStyle(COLOURS.BLACK, 28)
    textStyleDesc.wordWrap = true
    textStyleDesc.wordWrapWidth = optionButtonWidth - 10
    textStyleDesc.align = 'center'

    const title = new PIXI.Text(titleText, textStyleTitle)
    title.anchor.set(0.5)
    option.addText(title, 0.5, 0.2, `${optionName}Title`)

    const desc = new PIXI.Text(descriptionText, textStyleDesc)
    desc.anchor.set(0.5)
    option.addText(desc, 0.5, 0.6, `${optionName}Desc`)
}

class DeployedTowerAimMenu extends BigSwitchMenu {
    constructor(x, y) {
        super("deployedTowerAimMenu", x, y, "right", 10)
 
        // Aim at the emeny closest to the end of the track and in range
        this.firstOption = this.addOption(optionButtonWidth, COLOURS.AIM_RED, "selected-aim-first", true, false)
        createAimOptionText(this.firstOption, 'FIRST', 'Aim at the enemy closest to the end and in range', 'first')

        // Aim at the enemy closest to the start of the track and in range
        this.lastOption = this.addOption(optionButtonWidth, COLOURS.AIM_RED, "selected-aim-last", false, false)
        createAimOptionText(this.lastOption, 'LAST', 'Aim at the enemy furthest from the end and in range', 'last')

        // Aim at the enemy closest to the tower and in range
        this.closestOption = this.addOption(optionButtonWidth, COLOURS.AIM_RED, "selected-aim-closest", false, false)
        createAimOptionText(this.closestOption, 'CLOSEST', 'Aim at the enemy closest to this tower and in range', 'closest')
    }

    // Initialise the information displayed on the root menu component of the aim menu
    setRootInfo() {
        let fontSize = 30
        let style =  plainTextStyle(COLOURS.BLACK, fontSize)
        style.wordWrap = true
        style.wordWrapWidth = aimRootWidth - 10

        this.aimDescription = new PIXI.Text("Aim determines which enemy the tower will shoot", style)
        this.aimDescription.anchor.set(0, 0.5)
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
            case "closest":
                newActiveButton = this.closestOption
                break
        }
        this.setSelected(newActiveButton)
    }
}

class DeployedTowerSellMenu extends BigButtonMenu {
    constructor(x, y) {
        super("deployedTowerSellMenu", x, y, "right", -20)

        // Confirm the selling of the tower in exchange for the displayed amount of money
        this.yesOption = this.addOption(360, COLOURS.MONEY, "selected-sell-yes", true, false)

        const textStyle = plainTextStyle(COLOURS.BLACK, 40)
        const text = new PIXI.Text("Confirm sell for:", textStyle)
        text.anchor.set(0.5)
        
        const boldStyle = boldTextStyle(COLOURS.MONEY, 45)
        const price = new PIXI.Text("", boldStyle)
        price.anchor.set(0.5)

        this.yesOption.addText(text, 0.5, 0.3, 'confirm')
        this.yesOption.addText(price, 0.5, 0.66, 'price')

    }

    // Update just the contents of the info created in populateWithTowerInfo to ensure kill stats is up to date
    updateTowerInfo(tower) {
        this.yesOption.updateTextByName('price', `${tower.sellPrice}`)
        this.yesOption.autofitTextSize()
    }
}


const initText = (buttonWidth, fontSize) => {
    let style = plainTextStyle(COLOURS.BLACK, fontSize)
    style.wordWrap = true
    style.wordWrapWidth = buttonWidth - 20
    style.align = 'center'

    const text = new PIXI.Text('', style)
    text.anchor.set(0.5)
    return text
}

class DeployedTowerUpgradeOptionsMenu extends BigButtonMenu {
    constructor(x, y) {
        super("deployedTowerUpgradeOptionsMenu", x, y, "right", -10)

        this.prevTowerType = undefined

        const numberOfUpgrades = 3
        const buttonWidth = 300
        this.options = []
        for (let optIdx = 0; optIdx < numberOfUpgrades; optIdx += 1) {
            let upgradeOption = this.addOption(buttonWidth, COLOURS.UPGRADE_GREEN, "selected-upgrade-option")
            upgradeOption.addText(initText(buttonWidth, 32), 0.5, 0.2, 'title')
            upgradeOption.addText(initText(buttonWidth, 32), 0.5, 0.5, 'description')
            upgradeOption.addText(initText(buttonWidth, 32), 0.5, 0.8, 'cost')
            this.options.push(upgradeOption)
        }
    }

    updateTowerInfo(upgradeState, towerType, playerMoney) {
        const updateText = this.prevTowerType != towerType
        this.prevTowerType = towerType

        let upgradeIdx = 0
        for (const [upgradeType, {description, description_long, cost, purchased}] of Object.entries(upgradeState)) {
            let option = this.options[upgradeIdx]
            // Change in tower type, update the displayed text - don't do every time to save processing
            // TODO fix this
            // if (updateText) {
                option.updateTextByName('title', description.toUpperCase())
                option.updateTextByName('description', description_long)
                option.updateTextByName('cost', purchased ? "PURCHASED" : `Cost: ${cost}`)
                option.setParams({
                    "type": upgradeType
                })
            // }
            if (purchased){
                option.disableClickAndPush()
            } else if (playerMoney < cost) {
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
        this.mainMenu = new DeployedTowerMainMenu(x, y, this)
        this.mainMenu.subscribe(this)
        this.addChild(this.mainMenu)
        this.setUpEventListeners()
    }

    setUpEventListeners() {
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
        // TODO use hash to prevent continuous update
        // Live updates of the towers state
        this.mainMenu.updateTowerInfo(towerUpdate, activeTower, playerMoney)
    }

    setSelectedTower(tower) {
        // This is data to update once when the tower is clicked on
        this.selectedTower = tower
    }

    show() {
        super.show()
        this.children.forEach((child) => { child.visible = false })
        this.mainMenu.visible = true
    }

    hide() {
        super.hide()
        this.mainMenu.close()
    }
}
