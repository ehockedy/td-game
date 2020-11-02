import { DEFAULT_SPRITE_SIZE_X, DEFAULT_SPRITE_SIZE_Y } from "../../views/constants.js"
import { randomHexString } from "../../tools.js"
import { getUsername } from "../../state.js"
import { onDragTower, onPlaceTowerConfirm } from "../../views/game/callbacks.js" // TODO move these
import { BaseComponent } from "./base/baseComponent.js"

/**
 * This component stores all the information about the towers that are out on the map
 * In future, might be best to remove the sprite creation functions out
 */
export class TowersComponent extends BaseComponent {
    constructor(sprite_handler){
        super(sprite_handler)
        this.randomColourCode = "0x" + randomHexString(6); // TODO should be defined elsewhere
        this.towerStateHashPrev = ""
        this.rangeSpriteContainer = new PIXI.Container();
    }

    // Asynchronosly load the tower data
    loadData() {
        let _this = this
        let p = new Promise((resolve) => {
            $.getJSON("shared/json/towers.json", function (data) {
                _this.towerJson = data
                resolve()
            })
        })
        return p
    }

    // An additional container for the range sprites.
    // Required so that range always appears under all towers
    registerRangeSpriteContainer() {
        this.sprite_handler.registerContainer(this.rangeSpriteContainer)
    }

    setInfoToolbarLink(infoToolbar) {
        this.infoToolbarLink = infoToolbar
    }

    getTowerSprite(type) { // Make this a get sprite only function
        let texture = PIXI.Loader.shared.resources["client/img/tower_spritesheet.png"].texture
        let towerTexture = [new PIXI.Texture(texture, new PIXI.Rectangle(0, DEFAULT_SPRITE_SIZE_Y * this.towerJson[type]["spriteSheetNum"], DEFAULT_SPRITE_SIZE_X, DEFAULT_SPRITE_SIZE_Y))]
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

    addDraggableTower(type, x, y) {
        let sprite = this.getTowerSprite(type)
        sprite.interactive = true
        sprite.buttonMode = true
        sprite.name = randomHexString(6)
        sprite.dragging = false
        sprite.type = type
        sprite.owner = getUsername()
        sprite.x = x
        sprite.y = y
        sprite.tint = "0xAABBCC"

        // Attach a range sprite
        sprite.range_subsprite = this.getTowerRangeGraphic(type)
        sprite.range_subsprite.visible = false

        sprite
            .on("pointerdown", () => {
                 sprite.dragging = true
            })
            .on("pointermove", onDragTower)
            .on("pointerup", onPlaceTowerConfirm)
            .on("pointerupoutside", onPlaceTowerConfirm)
            .on("pointerover", ()=>{this.infoToolbarLink.onTowerMenuPointerOver(type)})
            .on("pointerout", () => {if(!sprite.dragging){this.infoToolbarLink.onTowerMenuPointerOff()}})
            .on("pointerup", () => {this.infoToolbarLink.onTowerMenuPointerOff()})
            .on("pointerupoutside", () => {this.infoToolbarLink.onTowerMenuPointerOff()})



        sprite.range_subsprite.setParent(this.rangeSpriteContainer) // TODO make differe nt container 
        sprite.setParent(this.container)
    }

    addPlacedTower(type, name, owner, row, col) {
        let sprite = this.getTowerSprite(type)
        sprite.name = name
        sprite.owner = owner

        sprite.gridX = col
        sprite.gridY = row
        sprite.x = sprite.gridX * DEFAULT_SPRITE_SIZE_X + DEFAULT_SPRITE_SIZE_X / 2;
        sprite.y = sprite.gridY * DEFAULT_SPRITE_SIZE_Y + DEFAULT_SPRITE_SIZE_Y / 2;

        if (owner == getUsername()) { // Only make the tower interactive if the user placed it
            sprite.interactive = true; // reponds to mouse and touch events
            sprite.buttonMode = true; // hand cursor appears when hover over
            sprite
                .on('click', ()=> {
                    if (this.sprite_handler.getActiveClickable() == sprite) { // Clicked on the currently active tower
                        sprite.emit("clickoff")
                    } else { // Clicked on tower that is not active
                        if (this.sprite_handler.isActiveClickableSet()) this.sprite_handler.getActiveClickable().emit('clickoff') // Cancel current active clickable
                        this.sprite_handler.setActiveClickable(sprite) // Register this as the active object
                        sprite.range_subsprite.visible = true // Show the range circle
                        this.infoToolbarLink.onDraggableTowerClick(type)
                    }
                })
                .on('clickoff', ()=>{  // This is a custom event triggered manually
                    sprite.range_subsprite.visible = false
                    this.sprite_handler.unsetActiveClickable()
                    this.infoToolbarLink.onDraggableTowerClickOff()
                });

            sprite.range_subsprite = this.getTowerRangeGraphic(type)
            sprite.range_subsprite.x = sprite.x
            sprite.range_subsprite.y = sprite.y
            sprite.range_subsprite.visible = false
            sprite.range_subsprite.setParent(this.rangeSpriteContainer)
        }

        sprite.setParent(this.container)
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
                for (let towerSpriteIdx = this.container.children.length - 1; towerSpriteIdx >= 0; towerSpriteIdx--) {
                    found = (this.container.children[towerSpriteIdx].name == towerStateObjects[nameIdx].name)
                    if (found) break;
                }
                if (!found) {
                    this.addPlacedTower(towerStateObjects[nameIdx].type,
                        towerStateObjects[nameIdx].name,
                        towerStateObjects[nameIdx].owner,
                        towerStateObjects[nameIdx].position.row,
                        towerStateObjects[nameIdx].position.col)
                }
            }
        }

        // Update state of towers present in server update
        towerStateObjects.forEach((tower) => {
            let towerToUpdate = this.container.getChildByName(tower.name)
            towerToUpdate.rotation = tower.angle
            towerToUpdate.tint = this.randomColourCode // TODO store all player colours once
        })
    }
}