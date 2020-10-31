import { DEFAULT_SPRITE_SIZE_X } from "../../views/constants.js"
import { TowerManager } from "../../views/game/tower.js"

export class TowerMenu {
    constructor(sprite_handler, width_px, height_px, x, y) {
        this.sprite_handler = sprite_handler
        this.containerName = "towermenu"

        this.width_px = width_px
        this.height_px = height_px
        this.x = x
        this.y = y

        this.infoToolbarLink
    }

    setInfoToolbarLink(infoToolbar) {
        this.infoToolbarLink = infoToolbar
    }

    registerContainer() {
        let container = new PIXI.Container(); // The grid all the action takes place in
        container.x = this.x
        container.y = this.y
        container.name = this.containerName

        // Add the toolbar background
        let graphics = new PIXI.Graphics();
        graphics.beginFill("0x727272")
        graphics.drawRect(0, 0, this.width_px, this.height_px)
        container.addChild(graphics)


        this.sprite_handler.registerContainer(container)
        this.addTowers()
    }

    addTowers() {
        let icon = this.getTower(0)
        icon
            .on("pointerover", ()=>{this.infoToolbarLink.onTowerMenuPointerOver(0)})
            .on("pointerover", this.onTowerMenuPointerOver)

        this.sprite_handler.addTowerMenuSprite(icon)
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
        let towerManager = new TowerManager()
        let tempTowerSprite = towerManager.getTowerSprite(type)
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

    onTowerMenuPointerOver() {
        console.log("Tower menu pointer over event")
    }
}