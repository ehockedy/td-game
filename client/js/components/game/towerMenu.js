import { BaseToolbarComponent } from "./base/baseToolbarComponent.js"
import { DEFAULT_SPRITE_SIZE_X, DEFAULT_SPRITE_SIZE_Y, APP_WIDTH, APP_HEIGHT, MAP_WIDTH, MAP_HEIGHT } from "../../constants.js"
import { getPositionWithinEquallySpacedObjects } from "../../tools.js"
import { sendMessage, getTowerUpdateMsg, MSG_TYPES } from "../../networking.js"
import { getUserID, getBoard } from "../../state.js"

export class TowerMenu  extends BaseToolbarComponent {
    constructor(sprite_handler, width_px, height_px, x, y) {
        super(sprite_handler, "towermenu", width_px, height_px, x, y)

        this.towerFactoryLink
        this.infoToolbarLink

        this.towerSpriteContainer = new PIXI.Container()
        this.rangeSpriteContainer = new PIXI.Container()
    }

    loadData() {
        let _this = this
        return new Promise((resolve) => {
            $.getJSON("shared/json/towers.json", function (data) {
                _this.towerJson = data
                resolve()
            })
        })
    }

    registerContainer() {
        super.registerContainer()
        this.sprite_handler.registerContainer(this.towerSpriteContainer) // Do not want to restrict the positions to the root container
    }

    setTowerFactoryLink(towerFactory) {
        this.towerFactoryLink = towerFactory
    }

    setInfoToolbarLink(infoToolbar) {
        this.infoToolbarLink = infoToolbar
    }

    // An additional container for the range sprites.
    // Required so that range always appears under all towers
    registerRangeSpriteContainer() {
        this.sprite_handler.registerContainer(this.rangeSpriteContainer)
    }

    addTowers() {
        for (let i = 0; i < 4; i++) {
            let icon = this.getTower(i)
            this.container.addChild(icon) // The placeholder
            this.towerSpriteContainer.addChild(this.getDraggableTower(i, this.x + icon.x, this.y + icon.y)) // The interactive, draggable icon
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

    getDraggableTower(type, x, y) {
        let sprite = this.towerFactoryLink.getTowerSprite(type)
        sprite.interactive = true
        sprite.buttonMode = true
        sprite.dragging = false
        sprite.type = type
        sprite.x = x
        sprite.y = y
        sprite.xStart = x
        sprite.yStart = y

        // Attach a range sprite
        sprite.range_subsprite = this.towerFactoryLink.getTowerRangeGraphic(type) // TODO make this a child, and put render distances on
        sprite.range_subsprite.visible = false

        let towerReset = () => {
            // Move back to original position
            sprite.x = sprite.xStart
            sprite.y = sprite.yStart
            sprite.range_subsprite.visible = false
            sprite.dragging = false
            this.startInteraction()
            this.towerFactoryLink.startInteraction()
            this.infoToolbarLink.hideDragTowerInfo()
            this.sprite_handler.unsetActiveClickable()
        }

        let onPointerOver = ()=>{
            this.infoToolbarLink.showDragTowerInfo(type)
            if (sprite.x == sprite.xStart && sprite.y == sprite.yStart) {
                this.sprite_handler.unclickActiveClickable()
            }
        }

        let onPointerOut = ()=>{
            if (sprite.x == sprite.xStart && sprite.y == sprite.yStart) {
                this.infoToolbarLink.hideDragTowerInfo()
                this.sprite_handler.unclickActiveClickable()
            }
        }

        let onPointerUp = () => {
            if (sprite.dragging) {
                if ((sprite.x < 0 || sprite.y < 0 || sprite.x > MAP_WIDTH || sprite.y > MAP_HEIGHT) && // Not on map
                    (sprite.x != sprite.xStart || sprite.y != sprite.yStart)) { // and has moved
                    towerReset()
                }
            }
            sprite.dragging = false
        }

        let onPointerDown = () => {
            sprite.dragging = true
            this.infoToolbarLink.showDragTowerInfo(type)
        }

        let onTowerMove = () => {
            if (sprite.dragging) {
                this.sprite_handler.setActiveClickable(sprite)

                // Stop another tower from being produced, or other towers from being interactable whilst placing this one
                this.stopInteraction()
                this.towerFactoryLink.stopInteraction()
                sprite.interactive = true
                sprite.buttonMode = true
            }
        }

        let onTowerPlaceConfirm = () => {
            if (sprite.x >= 0 && sprite.y >= 0 && sprite.x < MAP_WIDTH && sprite.y < MAP_HEIGHT) {
                sendMessage(MSG_TYPES.CLIENT_UPDATE_GAME_BOARD_CONFIRM, getTowerUpdateMsg(sprite))
            }
            towerReset()
        }

        // Tower icon sprite behaviour
        sprite
            .on("pointerover", onPointerOver)
            .on("pointerout", onPointerOut)
            .on("pointerdown", onPointerDown)
            .on("pointerup", onPointerUp)
            .on("pointerupoutside", onPointerUp)
            .on("pointermove", this.onDragTower)
            .on("pointermove", onTowerMove)
            .on("place", onTowerPlaceConfirm)
            .on("clear", towerReset)

        sprite.range_subsprite.setParent(this.rangeSpriteContainer)
        return sprite
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

    startInteraction() {
        this._setContainerInteraction(this.towerSpriteContainer, true)
    }

    stopInteraction() {
        this._setContainerInteraction(this.towerSpriteContainer, false)
    }

    update(playerData) {
        let money = 0
        let players = playerData.objects
        for (let i = 0; i < players.length; i++) {
            if (players[i].playerID == getUserID()) {
                money = players[i].stats.money
                break
            }
        }
        this.towerSpriteContainer.children.forEach((tower, idx) => {
            if (money < this.towerJson[idx].cost) {
                tower.interactive = false
                tower.buttonMode = false
            } else {
                tower.interactive = true
                tower.buttonMode = true
            }
        })
    }
}
