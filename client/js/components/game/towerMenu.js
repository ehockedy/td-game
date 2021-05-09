import { StaticHorizontalMenuOption } from "../ui_common/horizontalMenuOption.js"
import { getPositionWithinEquallySpacedObjects } from "../../tools.js"
import { BaseComponent } from "./base/baseComponent.js"
import { MenuIconTower } from "./towers/menuIconTower.js"
import { DraggableTower } from "./towers/draggableTower.js"
import { generateStyle, COLOURS } from "../ui_common/style.js"

/**
 * Class that represents the tower menu
 * It contains the menu sprite itself, holds the draggable tower sprites, and defines the area that the towers can move in
 */
export class TowerMenu extends BaseComponent {
    constructor(width_px, height_px, x, y, width_menu_px, height_menu_px, x_menu, y_menu) {
        super("towermenu")
        this.width_px = width_px
        this.height_px = height_px
        this.width_menu_px = width_menu_px
        this.height_menu_px = height_menu_px
        this.x = x
        this.y = y
        this.x_menu = x_menu
        this.y_menu = y_menu //- 15 - 70

        // The sprite that represents the background of the tower menu, where the draggable towers sit
        this.menuBackground = new StaticHorizontalMenuOption("towerMenuBackground", x_menu, y_menu,  this.width_menu_px, COLOURS.MENU_SANDY, "left")
        this.addChild(this.menuBackground)

        // The icons that mark the positions of the towers. They cannot be interacted with and do not move.
        this.icons = new PIXI.Container()
        this.addChild(this.icons)

        // The sprites that a user drags to place a tower
        this.sprites = new PIXI.Container()
        this.addChild(this.sprites)

        // The info boxes about the towers
        this.infoBoxes = new PIXI.Container()
        this.infoBoxes.position = this.menuBackground.position
        this.addChild(this.infoBoxes)

        // Set up event listeners
        this
            .on("pointerOverTower", (tower) => { this._onPointerOverTower(tower) })
            .on("pointerOutTower", (tower) => { this._onPointerOutTower(tower) })
    }

    setData(towerConfig, thisPlayer, thisPlayerColour) {
        this.towerConfig = towerConfig
        this.thisPlayer = thisPlayer
        this.thisPlayerColour = thisPlayerColour
    }

    // Subscribe the given observer to all of the draggable towers
    // Any event emitted by the towers will be sent to all the observers
    subscribeToAllTowers(observer) {
        this.sprites.children.forEach((s) => {
            s.subscribe(observer)
        })
    }

    // Adds an icon, and a draggable tower for each tower in the configuration
    addTowers() {
        const fontSize = 24

        let style = generateStyle("0x222222", fontSize)
        style.strokeThickness = 0
        let numTowers = 1 // Start at 1 because positioning function is 1 indexed
        for (let towerType in this.towerConfig) {
            let icon = new MenuIconTower(towerType, towerType + "_icon", this.towerConfig)

            let x = getPositionWithinEquallySpacedObjects(numTowers, Object.keys(this.towerConfig).length, icon.width, this.width_menu_px)
            let y = this.menuBackground.y + this.menuBackground.height / 2

            icon.x = x
            icon.y = y
            this.icons.addChild(icon)
            let towerSprite = new DraggableTower(towerType, towerType + "_drag", this.towerConfig, icon.x, icon.y, this.thisPlayerColour)
            this.sprites.addChild(towerSprite)

            // The info boxes that gives a description of the tower
            let infoBoxes = new PIXI.Container()
            infoBoxes.name = towerSprite.name
            infoBoxes.visible = false

            // What to put in each box
            const descText = this.towerConfig[towerType].displayInfo
            const costText = "Cost:    " + this.towerConfig[towerType].cost.toString()
            const typeText = "Type:    " + towerType

            // A crude way to scale the info box with the length of it's contents
            const descWidth = descText.length * 12.5
            const costWidth = costText.length * 13.5
            const typeWidth = typeText.length * 13.5

            let descBox = this._createTowerMenuInfoBox("desc", 0, descWidth, COLOURS.MENU_SANDY, descText, style)
            let costBox = this._createTowerMenuInfoBox("cost", 0, costWidth, COLOURS.MENU_SANDY, costText, style)
            let typeBox = this._createTowerMenuInfoBox("name", 0, typeWidth, COLOURS.MENU_SANDY, typeText, style)

            const gap = 4  // Gap between each of the info boxes
            descBox.y -= (descBox.height + gap)
            costBox.y = descBox.y - (costBox.height + gap)
            typeBox.y = costBox.y - (typeBox.height + gap)

            infoBoxes.addChild(descBox)
            infoBoxes.addChild(costBox)
            infoBoxes.addChild(typeBox)

            this.infoBoxes.addChild(infoBoxes)

            towerSprite.subscribe(this) // subscribe so that this menu can react to interaction with the towers

            numTowers += 1
        }
    }

    _createTowerMenuInfoBox(name, y, width, colour, content, style) {
        let infoBox = new StaticHorizontalMenuOption(name, 0, y, width, colour, "left", "half")
        let text = new PIXI.Text(content, style)
        text.anchor.set(0, 0.5)
        infoBox.addText(text, 0.01, 0.5)
        return infoBox
    }

    // State update function using external data
    // TODO should probably just pass user money through here - or even just send the relevant players data
    update(playerData) {
        // Disable the towers the user cannot afford
        let money = 0
        let players = playerData.objects
        for (let i = 0; i < players.length; i++) {
            if (players[i].playerID == this.thisPlayer) {
                money = players[i].stats.money
                break
            }
        }
        this.sprites.children.forEach((tower) => {
            if (money < tower.cost) {
                tower.disableInteractivity()
            } else {
                tower.enableInteractivity()
            }
        })
    }

    disableTowers() {
        this.sprites.children.forEach((tower) => {
            tower.interactiveChildren = false
        })
    }

    enableTowers() {
        this.sprites.children.forEach((tower) => {
            tower.interactiveChildren = true
        })
    }

    enableTowerByName(name) {
        this.sprites.getChildByName(name).interactiveChildren = true
    }

    // ~~~ Events ~~~
    _onPointerOverTower(tower) {
        this.infoBoxes.getChildByName(tower.name).visible = true
    }

    _onPointerOutTower(tower) {
        this.infoBoxes.getChildByName(tower.name).visible = false
    }
}
