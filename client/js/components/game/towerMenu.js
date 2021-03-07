import { rightEndedHorizontalMenuOption } from "../ui_common/horizontalMenuOption.js"
import { getPositionWithinEquallySpacedObjects } from "../../tools.js"
import { getUserID } from "../../state.js"
import { BaseComponent } from "./base/baseComponent.js"
import { MenuIconTower } from "./towers/menuIconTower.js"
import { DraggableTower } from "./towers/draggableTower.js"

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

        this.menuBackground = new rightEndedHorizontalMenuOption("towerMenuBackground", x_menu, y_menu,  this.width_menu_px - 500, "0xCCBB88")
        this.addChild(this.menuBackground)

        // The icons that mark the positions of the towers. They cannot be interacted with and do not move.
        this.icons = new PIXI.Container()
        this.addChild(this.icons)

        // The sprites that a user drags to place a tower
        this.sprites = new PIXI.Container()
        this.addChild(this.sprites)
    }

    // Setter for tower config
    setTowerData(data) {
        this.towerJson = data
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
        let numTowers = 1 // Start at 1 because positioning function is 1 indexed
        for (let towerType in this.towerJson) {
            let icon = new MenuIconTower(towerType, towerType + "_icon", this.towerJson)

            let x = getPositionWithinEquallySpacedObjects(numTowers, Object.keys(this.towerJson).length, icon.width, this.width_px)
            let y = this.menuBackground.y + this.menuBackground.height / 2

            icon.x = x
            icon.y = y
            this.icons.addChild(icon)
            let towerSprite = new DraggableTower(towerType, towerType + "_drag", this.towerJson, icon.x, icon.y)
            this.sprites.addChild(towerSprite)

            numTowers += 1
            if (numTowers >= 3) break // Temporary while adding other towers
        }
    }

    // State update function using external data
    // TODO should probably just pass user money through here
    update(playerData) {
        // Disable the towers the user cannot afford
        let money = 0
        let players = playerData.objects
        for (let i = 0; i < players.length; i++) {
            if (players[i].playerID == getUserID()) {
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
}
