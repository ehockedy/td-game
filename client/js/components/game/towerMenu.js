import { BaseToolbarComponent } from "./base/baseToolbarComponent.js";
import { DEFAULT_SPRITE_SIZE_X } from "../../constants.js"
import { getPositionWithinEquallySpacedObjects } from "../../tools.js"

export class TowerMenu  extends BaseToolbarComponent {
    constructor(sprite_handler, width_px, height_px, x, y) {
        super(sprite_handler, "towermenu", width_px, height_px, x, y)

        this.towerFactoryLink
    }

    setTowerFactoryLink(towerFactory) {
        this.towerFactoryLink = towerFactory
    }

    registerContainer() {
        super.registerContainer()
    }

    addTowers() {
        for (let i = 0; i < 4; i++) {
            let icon = this.getTower(i)
            this.container.addChild(icon) // The placeholder
            this.towerFactoryLink.addDraggableTower(i, this.x + icon.x, this.y + icon.y) // The interactive, draggable icon
        }
    }

    getTower(type) {
        let towerNum = type+1 // hacky but works
        let towersPerRow = 2
        let toolbarWidth = this.width_px
        let towerSpriteWidth = DEFAULT_SPRITE_SIZE_X

        let x = getPositionWithinEquallySpacedObjects(towerNum, towersPerRow, towerSpriteWidth, toolbarWidth)
        let y = 32 * 2 * (Math.floor(type/towersPerRow) + 1) // +1 so not starting at y = 0

        let towerSprite = this.towerFactoryLink.getTowerSprite(type)
        towerSprite.x = x
        towerSprite.y = y
        return towerSprite
    }
}
