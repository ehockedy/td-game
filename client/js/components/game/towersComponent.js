import { DEFAULT_SPRITE_SIZE_X, DEFAULT_SPRITE_SIZE_Y, APP_WIDTH, APP_HEIGHT, MAP_WIDTH, MAP_HEIGHT } from "../../constants.js"
import { randomHexString } from "../../tools.js"
import { getUserID, getBoard } from "../../state.js"
import { BaseComponent } from "./base/baseComponent.js"
import { sendMessage, getTowerUpdateMsg, MSG_TYPES } from "../../networking.js"

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
        this.towerSpriteSheetData = []
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

    setTowerMenuLink(towerMenu) {
        this.towerMenuLink = towerMenu
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

    addDraggableTower(type, x, y) {
        let sprite = this.getTowerSprite(type)
        sprite.interactive = true
        sprite.buttonMode = true
        sprite.name = randomHexString(6)
        sprite.dragging = false
        sprite.type = type
        sprite.x = x
        sprite.y = y

        // Attach a range sprite
        sprite.range_subsprite = this.getTowerRangeGraphic(type) // TODO make this a child, and put render distances on
        sprite.range_subsprite.visible = false

        // Tower icon sprite behaviour
        // Initial state is just an icon that can be dragged.
        // Once dragging MediaStreamTrackAudioSourceNode, behaviour changes
        sprite
            .on("pointerover", ()=>{ // Display the information about the tower - this triggers as soon as tower appears
                this.sprite_handler.unclickActiveClickable()
                this.infoToolbarLink.showTowerInfo(type)
            })
            .on("pointerout", ()=>{
                sprite.dragging = false // Turn off, because sprite object still exists, so don't want to trigger movement options i.e. stop interaction
                this.infoToolbarLink.hideTowerInfo()
                this.container.removeChild(sprite) // remove it, since wasn't used
            })
            .on("pointerdown", () => { sprite.dragging = true })
            .on("pointerup", () => { sprite.dragging = false })
            .on("pointermove", () => {
                if (sprite.dragging) {
                    // At this point, the user has clicked and dragged the tower, indicating they want to use it
                    // Remove the existing behaviour defined above, and set the new behaviour

                    // The tower is the active clickable object. This makes it accessible for the information toolbar to use
                    this.sprite_handler.setActiveClickable(sprite)

                    // Stop another tower from being produced, or other towers from being interactable hilst placing this one
                    this.towerMenuLink.stopInteraction()
                    this.stopInteraction()
                    sprite.interactive = true

                    let _this = this

                    function finishedWithTower() {
                        _this.startInteraction()
                        _this.cleanUpDraggableTower(sprite)
                    }
                    function onPointerUp() {
                        if (sprite.x >= 0 && sprite.y >= 0 && sprite.x < MAP_WIDTH && sprite.y < MAP_HEIGHT) sprite.dragging = false
                        else finishedWithTower() // If out of map, remove it
                    }

                    // Remove existing behaviour, then add new behaviour
                    sprite.removeAllListeners()
                    sprite.on("pointerdown", () => { sprite.dragging = true })
                    sprite.on("pointermove", this.onDragTower)
                    sprite.on("pointerup", onPointerUp)
                    sprite.on("pointerupoutside", onPointerUp)
                    sprite.on("place", this.onPlaceTowerConfirm) // Custom event triggered by pressing the confirm button
                    sprite.on("place", finishedWithTower)
                    sprite.on("clear", finishedWithTower)
                }
            })

        sprite.range_subsprite.setParent(this.rangeSpriteContainer)
        sprite.setParent(this.container)
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
            sprite
                .on('click', ()=> {
                    if (this.sprite_handler.getActiveClickable() == sprite) { // Clicked on the currently active tower
                        sprite.emit("clickoff")
                    } else { // Clicked on tower that is not active
                        if (this.sprite_handler.isActiveClickableSet()) this.sprite_handler.getActiveClickable().emit('clickoff') // Cancel current active clickable
                        this.sprite_handler.setActiveClickable(sprite) // Register this as the active object
                        sprite.range_subsprite.visible = true // Show the range circle
                        this.infoToolbarLink.showPlacedTowerInfo(type)
                    }
                })
                .on('clickoff', ()=>{  // This is a custom event triggered manually
                    sprite.range_subsprite.visible = false
                    this.sprite_handler.unsetActiveClickable()
                    this.infoToolbarLink.hidePlacedTowerInfo()
                });

            sprite.range_subsprite = this.getTowerRangeGraphic(type)
            sprite.range_subsprite.x = sprite.x
            sprite.range_subsprite.y = sprite.y
            sprite.range_subsprite.visible = false
            sprite.range_subsprite.setParent(this.rangeSpriteContainer)

            // Sprite stats (custom properties)
            sprite.kills = 0
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
                        towerStateObjects[nameIdx].playerID,
                        towerStateObjects[nameIdx].position.row,
                        towerStateObjects[nameIdx].position.col)
                }
            }
        }

        // Update state of towers present in server update
        towerStateObjects.forEach((tower) => {
            let towerToUpdate = this.container.getChildByName(tower.name)
            towerToUpdate.rotation = tower.angle
            towerToUpdate.tint = this.randomColourCode // TODO store all playerID colours once

            // Update the tower statsistics, but only store stats for towers a playerID owns
            if (tower.playerID == getUserID()) {
                towerToUpdate.stats = tower.stats
            }
        })
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~
    // Events - "this" is the parent object
    // ~~~~~~~~~~~~~~~~~~~~~~~
    onDragTower(event) {
        if (!this.dragging) return
    
        const newPosition = event.data.getLocalPosition(this.parent);
        if (newPosition.x >= 0 && newPosition.y >= 0 && newPosition.x < MAP_WIDTH && newPosition.y < MAP_HEIGHT) {
            // If on map, snap to grid
            let newGridX = Math.floor(newPosition.x / DEFAULT_SPRITE_SIZE_X)
            let newGridY = Math.floor(newPosition.y / DEFAULT_SPRITE_SIZE_Y)
            if ((newGridX != this.gridX || newGridY != this.gridY) && // Been some change
                getBoard()[newGridY][newGridX]["value"] == 0) { // Must be empty space
                this.gridX = newGridX
                this.gridY = newGridY
                this.x = this.gridX * DEFAULT_SPRITE_SIZE_X + DEFAULT_SPRITE_SIZE_X / 2;
                this.y = this.gridY * DEFAULT_SPRITE_SIZE_Y + DEFAULT_SPRITE_SIZE_Y / 2;
            }

            // Also move range indicator to be same position as tower
            this.range_subsprite.visible = true
            this.range_subsprite.x = this.x
            this.range_subsprite.y = this.y
        } else if (newPosition.x >= 0 && newPosition.y >= 0 && newPosition.x < APP_WIDTH && newPosition.y < APP_HEIGHT) {
            // Otherwise, update position normally
            this.x = newPosition.x
            this.y = newPosition.y
            this.range_subsprite.visible = false
        }
    }

    onPlaceTowerConfirm() {
        sendMessage(MSG_TYPES.CLIENT_UPDATE_GAME_BOARD_CONFIRM, getTowerUpdateMsg(this))
    }

    onPlaceTower() {
        if (this.x >= 0 && this.y >= 0 && this.x < MAP_WIDTH && this.y < MAP_HEIGHT) {
            sendMessage(MSG_TYPES.CLIENT_UPDATE_GAME_BOARD, getTowerUpdateMsg(this))
        } else {
            this.range_subsprite.parent.removeChild(this.range_subsprite)
            this.parent.removeChild(this)
        }
    }

    cleanUpDraggableTower(sprite) {
        this.rangeSpriteContainer.removeChild(sprite.range_subsprite)
        this.container.removeChild(sprite)
        this.towerMenuLink.startInteraction()
        this.infoToolbarLink.hideTowerInfo()
        this.sprite_handler.unsetActiveClickable()
    }

    stopInteraction() {
        this.container.children.forEach((child) => {
            child.interactive = false
        })
    }

    startInteraction() {
        this.container.children.forEach((child) => {
            child.interactive = true
        })
    }
}