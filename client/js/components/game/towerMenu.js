import { BaseToolbarComponent } from "./base/baseToolbarComponent.js"
import { DEFAULT_SPRITE_SIZE_X, DEFAULT_SPRITE_SIZE_Y, APP_WIDTH, APP_HEIGHT, MAP_WIDTH, MAP_HEIGHT } from "../../constants.js"
import { getPositionWithinEquallySpacedObjects } from "../../tools.js"
import { sendMessage, getTowerUpdateMsg, MSG_TYPES } from "../../networking.js"
import { getUserID, getBoard } from "../../state.js"
import { GraphicButton } from "../ui_common/button.js"
import { InfoTextBox } from "../ui_common/infoTextBox.js"

let transitionStates = {
    menuRevealing: 0,
    menuHiding: 1,
    infoRevealing: 2,
    infoHiding: 3,
    notMoving: 4
}

export class TowerMenu  extends BaseToolbarComponent {
    constructor(sprite_handler, width_px, height_px, x, y) {
        super("towermenu", width_px, height_px, x, y)
        this.sprite_handler = sprite_handler
        this.towerFactoryLink

        this.towersYOffset = 64

        this.towerSpriteContainer = new PIXI.Container()
        this.rangeSpriteContainer = new PIXI.Container()
        this.towerInfoContainer = new PIXI.Container()
        this.towerInfoDimension = 200

        this.placeTowerButtons = this.getSetTowerButtons()
        this.placeTowerButtons.visible = false

        let title = this.renderTitle("Towers")
        title.y = 16
        this.backgroundContainer.addChild(title)
        this.addChild(this.rangeSpriteContainer)
        this.addChild(this.towerSpriteContainer)
        this.addChildAt(this.towerInfoContainer, 0)
        this.addChild(this.placeTowerButtons)

        // Data used in sliding transitions
        this.transitionState = transitionStates.notMoving
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

    setTowerFactoryLink(towerFactory) {
        this.towerFactoryLink = towerFactory
    }

    addTowers() {
        for (let i = 0; i < this.towerJson.length; i++) {
            let icon = this.getTower(i)
            icon.y += this.towersYOffset
            this.backgroundContainer.addChild(icon) // The placeholder
            this.towerSpriteContainer.addChild(this.getDraggableTower(i, icon.x, icon.y)) // The interactive, draggable icon

            let infoTextBox = new InfoTextBox(0, 0, this.towerInfoDimension, this.towerInfoDimension, this.towerJson[i].displayInfo, 16)
            infoTextBox.visible = false
            this.towerInfoContainer.x = -this.towerInfoDimension
            this.towerInfoContainer.addChild(infoTextBox)
        }
    }

    getTower(type) {
        let towerNum = type+1 // hacky but works
        let towersPerRow = 3
        let toolbarWidth = this.width_px
        let towerSpriteWidth = DEFAULT_SPRITE_SIZE_X

        let x = getPositionWithinEquallySpacedObjects(towerNum, towersPerRow, towerSpriteWidth, toolbarWidth)
        let y = 32 * 2 * (Math.floor(type/towersPerRow)) // +1 so not starting at y = 0

        let towerSprite = this.towerFactoryLink.getTowerSprite(type)
        towerSprite.x = x
        towerSprite.y = y

        let style = {
            fontFamily: 'Arial',
            fontSize: 14
        }
        let costText = new PIXI.Text("£"+this.towerJson[type].cost.toString(), style);
        costText.anchor.set(0.5, 0)
        costText.y += DEFAULT_SPRITE_SIZE_Y/2
        towerSprite.addChild(costText)

        return towerSprite
    }

    getDraggableTower(type, x, y) {
        let sprite = this.towerFactoryLink.getTowerSprite(type)
        sprite.interactive = true
        sprite.buttonMode = true
        sprite.dragging = false
        sprite.moved = false
        sprite.type = type

        sprite.x = x
        sprite.y = y
        sprite.global_x = sprite.x + this.x
        sprite.global_y = sprite.y + this.y
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
            sprite.moved = false
            this.startInteraction()
            this.towerFactoryLink.startInteraction()
            this.towerInfoContainer.getChildAt(type).visible = false
            this.sprite_handler.unsetActiveClickable()
            this.placeTowerButtons.visible = false
            this.slideIn()
        }

        let onPointerOver = ()=>{
            this.towerInfoContainer.getChildAt(type).visible = true
            if (!sprite.moved) {
                this.sprite_handler.unclickActiveClickable()
            }
        }

        let onPointerOut = ()=>{
            if (!sprite.moved) {
                this.sprite_handler.unclickActiveClickable()
                this.towerInfoContainer.getChildAt(type).visible = false
            }
        }

        let onPointerUp = () => {
            if (sprite.dragging) {
                if ((sprite.global_x < 0 || sprite.global_y < 0 || sprite.global_x > MAP_WIDTH || sprite.global_y > MAP_HEIGHT) && // Not on map
                    sprite.moved) { // and has moved
                    towerReset()
                } else {
                    this.placeTowerButtons.visible = true
                    this.placeTowerButtons.x = sprite.x
                    if (sprite.gridY == 0) {
                        this.placeTowerButtons.y = sprite.y + 32
                    } else {
                        this.placeTowerButtons.y = sprite.y - 32
                    }
                }
            }
            sprite.dragging = false
        }

        let onPointerDown = () => {
            sprite.dragging = true
            this.placeTowerButtons.visible = false
        }

        let onTowerMove = () => {
            if (sprite.dragging) {
                if (!sprite.moved) {
                    sprite.moved = true
                    this.slideOut()
                }
                this.sprite_handler.setActiveClickable(sprite)

                // Stop another tower from being produced, or other towers from being interactable whilst placing this one
                this.stopInteraction()
                this.towerFactoryLink.stopInteraction()
                sprite.interactive = true
                sprite.buttonMode = true
            }
        }

        let onTowerPlaceConfirm = () => {
            if (sprite.global_x >= 0 && sprite.global_y >= 0 && sprite.global_x < MAP_WIDTH && sprite.global_y < MAP_HEIGHT) {
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

    /**
     * The button that you press to confirm tower placement
     */
    getSetTowerButtons() {
        let localContainer = new PIXI.Container()
        let yOffset = 0

        let buttonHeight = 24
        let buttonWidth = 24
        let width_px = buttonWidth * 2 + 16 // 10 is gap between buttons

        let confirmButton =  new GraphicButton(buttonWidth, buttonHeight, getPositionWithinEquallySpacedObjects(1, 2, buttonWidth, width_px)-width_px/2, yOffset, "\u{1F5F8}" , 20, "0x22FF22")
        let confirm = () => {
            this.sprite_handler.getActiveClickable().emit("place")
        }
        confirmButton.on("click", confirm)
        confirmButton.on("tap", confirm)
        localContainer.addChild(confirmButton)

        let cancelButton =  new GraphicButton(buttonWidth, buttonHeight, getPositionWithinEquallySpacedObjects(2, 2, buttonWidth, width_px) - width_px/2, yOffset, "\u{2717}", 20, "0xFF2222")
        let deny = () => {
            this.sprite_handler.getActiveClickable().emit("clear")
        }
        cancelButton.on("click", deny)
        cancelButton.on("tap", deny)
        localContainer.addChild(cancelButton)

        return localContainer
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~
    // Events - "this" is the parent object
    // ~~~~~~~~~~~~~~~~~~~~~~~
    onDragTower(event) {
        if (!this.dragging) return
        const newPosition = event.data.global
        if (newPosition.x >= 0 && newPosition.y >= 0 && newPosition.x < MAP_WIDTH && newPosition.y < MAP_HEIGHT) {
            // If on map, snap to grid
            let newGridX = Math.floor(newPosition.x / DEFAULT_SPRITE_SIZE_X)
            let newGridY = Math.floor(newPosition.y / DEFAULT_SPRITE_SIZE_Y)
            if ((newGridX != this.gridX || newGridY != this.gridY) && // Been some change
                getBoard()[newGridY][newGridX]["value"] == 0) { // Must be empty space
                this.gridX = newGridX
                this.gridY = newGridY
                this.global_x = this.gridX * DEFAULT_SPRITE_SIZE_X + DEFAULT_SPRITE_SIZE_X / 2
                this.global_y = this.gridY * DEFAULT_SPRITE_SIZE_Y + DEFAULT_SPRITE_SIZE_Y / 2
                this.x = this.global_x - this.parent.parent.x;
                this.y = this.global_y - this.parent.parent.y;
            }

            // Also move range indicator to be same position as tower
            this.range_subsprite.visible = true
            this.range_subsprite.x = this.x
            this.range_subsprite.y = this.y
        } else if (newPosition.x >= 0 && newPosition.y >= 0 && newPosition.x < APP_WIDTH && newPosition.y < APP_HEIGHT) {
            // Otherwise, update position normally
            this.global_x = newPosition.x
            this.global_y = newPosition.y
            this.x = this.global_x - this.parent.parent.x;
            this.y = this.global_y - this.parent.parent.y;
            this.range_subsprite.visible = false
        }
    }

    startInteraction() {
        this._setContainerInteraction(this.towerSpriteContainer, true)
    }

    stopInteraction() {
        this._setContainerInteraction(this.towerSpriteContainer, false)
    }

    slideOut() {
        this.transitionState = transitionStates.infoHiding
    }

    slideIn() {
        this.transitionState = transitionStates.menuRevealing
    }

    updateSlidingState() {
        let menuSpeed = 10
        let infoSpeed = 12

        switch (this.transitionState) {
            case transitionStates.infoHiding:
                if (!this.transitionX(this.towerInfoContainer, this.towerInfoContainer.x, 0, infoSpeed)) {
                    this.transitionState = transitionStates.menuHiding
                }
                break;
            case transitionStates.menuHiding:
                this.transitionX(this.towerInfoContainer, 0, this.width_px, menuSpeed)
                this.towerSpriteContainer.children.forEach((sprite) => { // todo make this a bit nicer
                    if (sprite == this.sprite_handler.getActiveClickable()) sprite.visible = true
                    else sprite.visible = false
                })
                if (!this.transitionX(this.backgroundContainer, 0, this.width_px, menuSpeed)) {
                    this.transitionState = transitionStates.notMoving
                }
                break;
            case transitionStates.infoRevealing:
                if (!this.transitionX(this.towerInfoContainer, 0, -this.towerInfoDimension, infoSpeed)) {
                    this.transitionState = transitionStates.notMoving
                }
                break;
            case transitionStates.menuRevealing:
                this.towerSpriteContainer.children.forEach((sprite) => {sprite.visible = false})
                if (!this.transitionX(this.backgroundContainer, this.width_px, 0, menuSpeed)) {
                    this.transitionState = transitionStates.infoRevealing
                    this.towerSpriteContainer.children.forEach((sprite) => {sprite.visible = true})
                }
                break;
            case transitionStates.notMoving:
            default:
                break;
        }
    }

    // For a given container, specify the start position and end position and travel speed
    // Once call to this function will move the container by speed number of pixels in the direction of start -> finish
    // returns true if there is more to move, false if has reached target position
    transitionX(container, startPos, endPos, speedMagnitude) {
        if (speedMagnitude == 0 || startPos == endPos ) return false
        let direction = (endPos - startPos) / Math.abs(endPos - startPos) // Direction of travel (+1 or -1)
        container.x = (direction == 1) ? Math.min(container.x + speedMagnitude * direction, endPos) : Math.max(container.x + speedMagnitude * direction, endPos)
        return container.x != endPos
    }

    tick() {
        super.tick()
        this.updateSlidingState()
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
