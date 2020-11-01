import { BaseToolbarComponent } from "./base/baseToolbarComponent.js";
import { DEFAULT_SPRITE_SIZE_X } from "../../views/constants.js"
import { TowerManager } from "../../views/game/tower.js"

export class TowerMenu  extends BaseToolbarComponent {
    constructor(sprite_handler, width_px, height_px, x, y) {
        super(sprite_handler, "towermenu", width_px, height_px, x, y)

        this.infoToolbarLink
        this.towerFactoryLink
    }

    setInfoToolbarLink(infoToolbar) {
        this.infoToolbarLink = infoToolbar
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
            icon
                .on("pointerover", ()=>{this.infoToolbarLink.onTowerMenuPointerOver(i)})
                .on("pointerover", ()=>{this.towerFactoryLink.addDraggableTower(i, this.x + icon.x, this.y + icon.y)})
            this.container.addChild(icon)
        }
    }

    getTower(type) {
        let towersCount = this.sprite_handler.containerSize(this.containerName)-1
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
        return this.getTowerIcon(type, x, y)
    }

    /**
     * Interactive sprite of the tower the user has slected
     * Once interacted with, adds a sprite to replace the one taken
     * Can be placed on the map, or is removed otherwise
     * @param {Number/String?} type Tower type
     * @param {Number} x x position
     * @param {Number} y y position
     */
    getTowerIcon(type, x, y) {
        let tempTowerSprite = this.towerFactoryLink.getTowerSprite(type)
        tempTowerSprite.x = x
        tempTowerSprite.y = y
        tempTowerSprite.interactive = true
        tempTowerSprite.buttonMode = true;

        //this.container.addChild(tempTowerSprite)

        // Interaction options
        // tempTowerSprite
        //     .on("pointerover", () => {
        //         // If pointer over, it means that a tower sprite it not here already
        //         // since if pointerover is not triggered if a sprite sits on top of the icon
        //         //this.towerManager.addDraggableTower(type, this.container.x + x, this.container.y + y)
        //         this.sprite_handler.towerFactory
        // })

        return tempTowerSprite
    }

}