import { Toolbar } from "./toolbar.js"
import { DEFAULT_SPRITE_SIZE_X, DEFAULT_SPRITE_SIZE_Y } from "../constants.js"

class TowerToolbar extends Toolbar{
    constructor(width_px, height_px, x, y, towerManager, col="0x727272") {
        super(width_px, height_px, x, y, col)
        this.towerManager = towerManager
        this.addTower(0)
    }

    addTower(type) {
        let towersCount = this.towerManager.getTowerCount()
        let towersPerRow = 2
        let toolbarWidth = this.width_px
        let towerSpriteWidth = DEFAULT_SPRITE_SIZE_X

        // TODO put this in tools - can be used elsewhere
        let spacing = (toolbarWidth - (towersPerRow*towerSpriteWidth)) / (towersPerRow + 1)
        // Equally space the towers across the menu where all the spaces are equal width
        // <space><tower><space><tower><space>
        // |__________________________________|
        //                  |
        //               <toolbar>
        // toolbar = 2*tower + 3*space
        // space = (toolbar - 2*tower) / 3
        // We know toolbar width and tower width, so can work out space width. Then replace 2 and 3 with n and (n+1)
        let x = (spacing + towerSpriteWidth/2) + ((spacing + towerSpriteWidth) * (towersCount % towersPerRow))
        let y = 32 * 2 * (Math.floor(towersCount/towersPerRow) + 1) // +1 so not starting at y = 0

        // Add a sprite where the menu icon has been positioned
        // When it is used (moved), put another one there
        this.addTowerIcon(type, x, y)
    }

    /**
     * Interactive sprite of the tower the user has slected
     * Once interacted with, adds a sprite to replace the one taken
     * Can be placed on the map, or is removed otherwise
     * @param {Number/String?} type Tower type
     * @param {Number} x x position
     * @param {Number} y y position
     */
    addTowerIcon(type, x, y) {
        let tempTowerSprite = this.towerManager.getTowerSprite(type)
        tempTowerSprite.x = x
        tempTowerSprite.y = y
        tempTowerSprite.interactive = true
        tempTowerSprite.buttonMode = true;

        this.container.addChild(tempTowerSprite)

        // Interaction options
        tempTowerSprite
            .on("pointerover", () => {
                // If pointer over, it means that a tower sprite it not here already
                // since if pointerover is not triggered if a sprite sits on top of the icon
                this.towerManager.addDraggableTower(type, this.container.x + x, this.container.y + y)
        })
    }
}


export { TowerToolbar }
