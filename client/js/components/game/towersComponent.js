import { DEFAULT_SPRITE_SIZE_X, DEFAULT_SPRITE_SIZE_Y } from "../../constants.js"
import { randomHexString } from "../../tools.js"
import { getUserID } from "../../state.js"
import { BaseComponent } from "./base/baseComponent.js"
import { TowerInfoComponent } from "./towerInfoComponent.js"

/**
 * This component stores all the information about the towers that are out on the map
 * In future, might be best to remove the sprite creation functions out
 */
export class TowersComponent extends BaseComponent {
    constructor(sprite_handler){
        super()
        this.sprite_handler = sprite_handler
        this.randomColourCode = "0x" + randomHexString(6); // TODO should be defined elsewhere
        this.towerStateHashPrev = ""
        this.rangeSpriteContainer = new PIXI.Container();
        this.towerSpriteSheetData = []

        this.setTowersContainer = new PIXI.Container()
        this.addChild(this.rangeSpriteContainer)
        this.addChild(this.setTowersContainer)
    }

    // Asynchronosly load the tower data
    loadData() {
        let _this = this
        return new Promise((resolve) => {
            $.getJSON("shared/json/towers.json", function (data) {
                _this.towerJson = data

                let texture = PIXI.Loader.shared.resources["client/img/tower_spritesheet.png"].texture
                _this.towerJson.forEach((tower)=> {
                    _this.towerSpriteSheetData.push([new PIXI.Texture(texture, new PIXI.Rectangle(0, DEFAULT_SPRITE_SIZE_Y * tower["spriteSheetNum"], DEFAULT_SPRITE_SIZE_X, DEFAULT_SPRITE_SIZE_Y))])
                })
                resolve()
            })
        })
    }

    getTowerSprite(type) { // Make this a get sprite only function
        let towerTexture = this.towerSpriteSheetData[type]
        let towerSprite = new PIXI.AnimatedSprite(towerTexture)
        towerSprite.tint = this.randomColourCode
        towerSprite.loop = false
        towerSprite.anchor.set(0.5)
        return towerSprite
    }

    getTowerRangeGraphic(type) {
        let graphics = new PIXI.Graphics();
        graphics.beginFill("0xe74c3c") // Red
        graphics.alpha = 0.5
        graphics.drawCircle(0, 0, this.towerJson[type]["gameData"]["seekRange"] * DEFAULT_SPRITE_SIZE_Y) // position 0, 0 of the graphics canvas
        return graphics
    }

    addPlacedTower(type, name, playerID, row, col) {
        let sprite = this.getTowerSprite(type)
        sprite.name = name
        sprite.playerID = playerID

        sprite.gridX = col
        sprite.gridY = row
        sprite.x = sprite.gridX * DEFAULT_SPRITE_SIZE_X + DEFAULT_SPRITE_SIZE_X / 2;
        sprite.y = sprite.gridY * DEFAULT_SPRITE_SIZE_Y + DEFAULT_SPRITE_SIZE_Y / 2;

        if (playerID == getUserID()) { // Only make the tower interactive if the user placed it
            sprite.interactive = true; // reponds to mouse and touch events
            sprite.buttonMode = true; // hand cursor appears when hover over
            sprite.info = new TowerInfoComponent(sprite)
            sprite.info.visible = false
            sprite.info.position = sprite.position
            sprite
                .on('click', ()=> {
                    if (this.sprite_handler.getActiveClickable() == sprite) { // Clicked on the currently active tower
                        sprite.emit("clickoff")
                    } else { // Clicked on tower that is not active
                        if (this.sprite_handler.isActiveClickableSet()) this.sprite_handler.getActiveClickable().emit('clickoff') // Cancel current active clickable
                        this.sprite_handler.setActiveClickable(sprite) // Register this as the active object
                        sprite.range_subsprite.visible = true // Show the range circle
                        sprite.info.visible = true
                    }
                })
                .on('clickoff', ()=>{  // This is a custom event triggered manually
                    sprite.range_subsprite.visible = false
                    this.sprite_handler.unsetActiveClickable()
                    sprite.info.visible = false
                });

            sprite.range_subsprite = this.getTowerRangeGraphic(type)
            sprite.range_subsprite.x = sprite.x
            sprite.range_subsprite.y = sprite.y
            sprite.range_subsprite.visible = false
            sprite.range_subsprite.setParent(this.rangeSpriteContainer)
            this.rangeSpriteContainer.addChild(sprite.info)

            // Sprite stats (custom properties)
            sprite.kills = 0
        }
        this.setTowersContainer.addChild(sprite)
    }

    update(towerData) {
        let towerStateObjects = towerData["objects"];
        let towerStateHash = towerData["hash"];

        if (towerStateHash != this.towerStateHashPrev) {
            this.towerStateHashPrev = towerStateHash

            // Identify tower not in container but in server update
            let nameIdx = 0
            for (nameIdx; nameIdx < towerStateObjects.length; nameIdx++) {
                let found = false;
                for (let towerSpriteIdx = this.setTowersContainer.children.length - 1; towerSpriteIdx >= 0; towerSpriteIdx--) {
                    found = (this.setTowersContainer.children[towerSpriteIdx].name == towerStateObjects[nameIdx].name)
                    if (found) break;
                }
                if (!found) {
                    this.addPlacedTower(towerStateObjects[nameIdx].type,
                        towerStateObjects[nameIdx].name,
                        towerStateObjects[nameIdx].playerID,
                        towerStateObjects[nameIdx].position.row,
                        towerStateObjects[nameIdx].position.col)
                }
            }
        }

        // Update state of towers present in server update
        towerStateObjects.forEach((tower) => {
            let towerToUpdate = this.setTowersContainer.getChildByName(tower.name)
            towerToUpdate.rotation = tower.angle
            towerToUpdate.tint = this.randomColourCode // TODO store all playerID colours once

            // Update the tower statsistics, but only store stats for towers a playerID owns
            if (tower.playerID == getUserID()) {
                towerToUpdate.info.update(tower.stats)
            }
        })
    }

    startInteraction() {
        this._setContainerInteraction(this.setTowersContainer, true)
    }

    stopInteraction() {
        this._setContainerInteraction(this.setTowersContainer, false)
    }
}