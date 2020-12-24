import { BaseToolbarComponent } from "./base/baseToolbarComponent.js"
import { getPositionWithinEquallySpacedObjects } from "../../tools.js"
import { sendMessage, getTowerUpdateMsg, MSG_TYPES } from "../../networking.js"
import { getUserID, getBoard } from "../../state.js"
import { GraphicButton } from "../ui_common/button.js"
import { InfoTextBox } from "../ui_common/infoTextBox.js"

let transitionStates = {
    menuOpening: 0,
    menuClosing: 1,
    infoOpening: 2,
    infoClosing: 3,
    menuThenInfoOpening: 4,
    infoThenMenuClosing: 5,
    notMoving: 6
}

export class TowerMenu  extends BaseToolbarComponent {
    constructor(sprite_handler, width_px, height_px, x, y, towerAreaBoundsX, towerAreaBoundsY, towerSpriteSize) {
        super("towermenu", width_px, height_px, x, y)
        this.sprite_handler = sprite_handler
        this.towerSpriteSize = towerSpriteSize
        this.towerAreaBoundsX = towerAreaBoundsX
        this.towerAreaBoundsY = towerAreaBoundsY
        this.towerFactoryLink

        this.towersYOffset = 64

        this.towerSpriteContainer = new PIXI.Container()
        this.activeTowerSpriteContainer = new PIXI.Container()
        this.rangeSpriteContainer = new PIXI.Container()
        this.towerInfoContainer = new PIXI.Container()
        this.towerInfoDimension = 200

        this.placeTowerButtons = this.getSetTowerButtons()
        this.placeTowerButtons.visible = false

        this.toggleMenuButton = this.getMenuToggleButton()

        let title = this.renderTitle("Towers")
        title.y = 16
        this.backgroundContainer.addChild(title)
        this.addChild(this.rangeSpriteContainer)
        this.addChild(this.towerSpriteContainer)
        this.addChild(this.activeTowerSpriteContainer)
        this.addChildAt(this.towerInfoContainer, 0)
        this.addChild(this.placeTowerButtons)
        this.backgroundContainer.addChild(this.toggleMenuButton)

        // Data used in sliding transitions
        this.transitionState = transitionStates.notMoving
    }

    loadData() {
        let _this = this
        return new Promise((resolve) => {
            fetch("shared/json/towers.json").then((response) => {
                response.json().then((data) => {
                    _this.towerJson = data
                    resolve()
                })
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
        let towerSpriteWidth = this.towerSpriteSize

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
        costText.y += this.towerSpriteSize/2
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
            this.unsetActiveTower()
            this.startInteraction()
            this.towerFactoryLink.startInteraction()
            this.towerInfoContainer.getChildAt(type).visible = false
            this.placeTowerButtons.visible = false
            this.triggerWholeMenuOpen()
        }

        let onPointerOver = ()=>{
            this.towerInfoContainer.getChildAt(type).visible = true
            if (!sprite.moved) {
                this.unsetActiveTower()
                this.sprite_handler.unclickActiveClickable()
            }
        }

        let onPointerOut = ()=>{
            if (!sprite.moved) {
                this.unsetActiveTower()
                this.towerInfoContainer.getChildAt(type).visible = false
            }
        }

        let onPointerUp = () => {
            if (sprite.dragging) {
                if (!this.isPositionOnMap(sprite.global_x, sprite.global_y)  // Not on map
                    && sprite.moved) { // and has moved
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
                this.setActiveTower(sprite)

                if (!sprite.moved) {
                    sprite.moved = true
                    this.triggerWholeMenuClose()
                }

                // Stop another tower from being produced, or other towers from being interactable whilst placing this one
                this.stopInteraction()
                this.towerFactoryLink.stopInteraction()
                sprite.interactive = true
                sprite.buttonMode = true
            }
        }

        let onTowerPlaceConfirm = () => {
            if (this.isPositionOnMap(sprite.global_x, sprite.global_y)) {
                sendMessage(MSG_TYPES.CLIENT_UPDATE_GAME_BOARD_CONFIRM, getTowerUpdateMsg(sprite))
            }
            towerReset()
        }

        let onDragTower = (event) => {
            this.onDragTower(event, sprite)
        }

        // Tower icon sprite behaviour
        sprite
            .on("pointerover", onPointerOver)
            .on("pointerout", onPointerOut)
            .on("pointerdown", onPointerDown)
            .on("pointerup", onPointerUp)
            .on("pointerupoutside", onPointerUp)
            .on("pointermove", onDragTower)
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

    getMenuToggleButton() {
        let toggleButton = new GraphicButton(20, 20, -20, 0, ">" , 18, "0x727272", 0, 0)
        toggleButton.menuOpen = true
        let toggle = () => {
            if (toggleButton.menuOpen) {
                this.triggerMenuClose()
            } else {
                this.triggerMenuOpen()
                if (this.sprite_handler.isActiveClickableSet()) {
                    this.sprite_handler.getActiveClickable().emit("clear")
                }
            }
        }
        toggleButton.on("click", toggle)
        toggleButton.on("tap", toggle)
        return toggleButton
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~
    // Event
    // ~~~~~~~~~~~~~~~~~~~~~~~
    onDragTower(event, sprite) {
        if (!sprite.dragging) return
        const newPosition = event.data.global
        if (this.isPositionOnMap(newPosition.x, newPosition.y)) {
            // If on map, snap to grid
            let newGridX = Math.floor(newPosition.x / this.towerSpriteSize)
            let newGridY = Math.floor(newPosition.y / this.towerSpriteSize)
            if ((newGridX != sprite.gridX || newGridY != sprite.gridY) && // Been some change
                getBoard()[newGridY][newGridX]["value"] == 0) { // Must be empty space
                sprite.gridX = newGridX
                sprite.gridY = newGridY
                sprite.global_x = sprite.gridX * this.towerSpriteSize + this.towerSpriteSize / 2
                sprite.global_y = sprite.gridY * this.towerSpriteSize + this.towerSpriteSize / 2
                sprite.x = sprite.global_x - this.x;
                sprite.y = sprite.global_y - this.y;

                // Also move range indicator to be same position as tower
                sprite.range_subsprite.visible = true
                sprite.range_subsprite.x = sprite.x
                sprite.range_subsprite.y = sprite.y
            }
        }
    }

    setActiveTower(tower) {
        this.sprite_handler.setActiveClickable(tower)
        this.activeTowerSpriteContainer.addChild(tower)
        this.towerActive = true
        this.towerSpriteContainer.removeChild(tower)
    }

    unsetActiveTower() {
        if (this.towerActive) {
            let removedTower = this.activeTowerSpriteContainer.removeChildAt(0)
            this.towerSpriteContainer.addChild(removedTower)
            this.towerActive = false
            this.sprite_handler.unsetActiveClickable(removedTower)
        }
    }

    startInteraction() {
        this._setContainerInteraction(this.towerSpriteContainer, true)
    }

    stopInteraction() {
        this._setContainerInteraction(this.towerSpriteContainer, false)
    }

    isPositionOnMap(x, y) {
        return x >= 0 && y >= 0 && x < this.towerAreaBoundsX && y < this.towerAreaBoundsY
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Menu transition animation methods
    // Private
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~
    triggerWholeMenuClose() {
        this.transitionState = transitionStates.infoThenMenuClosing
    }

    triggerMenuClose() {
        this.transitionState = transitionStates.menuClosing
    }

    triggerInfoOpen() {
        this.transitionState = transitionStates.infoOpening
    }

    triggerMenuOpen() {
        this.transitionState = transitionStates.menuOpening
    }

    triggerWholeMenuOpen() {
        this.transitionState = transitionStates.menuThenInfoOpening
    }

    menuToggleClose() {
        this.toggleMenuButton.menuOpen = false
        this.toggleMenuButton.updateText("<")
    }

    menuToggleOpen() {
        this.toggleMenuButton.menuOpen = true
        this.toggleMenuButton.updateText(">")
    }

    updateSlidingState(transitionState) {
        let menuSpeed = 12
        let infoSpeed = 15
        let endState = transitionState
    
        // Based on the given state of the transition, update the positions of the relevant components that should move
        let transitionComplete = false
        switch (transitionState) {
            case transitionStates.infoClosing:
            case transitionStates.infoThenMenuClosing:
                transitionComplete = this.transitionX(this.towerInfoContainer, -this.towerInfoDimension, this.width_px, infoSpeed)
                break;
            case transitionStates.infoOpening:
                transitionComplete = this.transitionX(this.towerInfoContainer, this.width_px, -this.towerInfoDimension, infoSpeed)
                break;
            case transitionStates.menuClosing:
                this.transitionX(this.towerSpriteContainer, 0, this.width_px, menuSpeed)
                transitionComplete = this.transitionX(this.backgroundContainer, 0, this.width_px, menuSpeed)
                break;
            case transitionStates.menuOpening:
            case transitionStates.menuThenInfoOpening:
                this.transitionX(this.towerSpriteContainer, this.width_px, 0, menuSpeed)
                transitionComplete = this.transitionX(this.backgroundContainer, this.width_px, 0, menuSpeed)
                break;
            case transitionStates.notMoving:
            default:
                break;
        }

        // If the transition has finished, carry out and actions and change to relevant state
        if (transitionComplete) {
            endState = transitionStates.notMoving
            switch (transitionState) {
                case transitionStates.infoThenMenuClosing:
                    endState = transitionStates.menuClosing
                    break
                case transitionStates.menuThenInfoOpening:
                    endState = transitionStates.infoOpening
                    // no break
                case transitionStates.menuOpening:
                    this.menuToggleOpen()
                    break
                case transitionStates.menuClosing:
                    this.menuToggleClose()
                    break
                default:
                    break
            }
        }
        return endState
    }

    // For a given container, specify the start position and end position and travel speed
    // Once call to this function will move the container by speed number of pixels in the direction of start -> finish
    // returns false if there is more to move, true if has reached target position
    transitionX(container, startPos, endPos, speedMagnitude) {
        if (speedMagnitude == 0 || startPos == endPos ) return true
        if (!container.visible) {
            container.x = endPos
        } else {
            let direction = (endPos - startPos) / Math.abs(endPos - startPos) // Direction of travel (+1 or -1)
            container.x = (direction == 1) ? Math.min(container.x + speedMagnitude * direction, endPos) : Math.max(container.x + speedMagnitude * direction, endPos)
        }
        return container.x == endPos
    }

    tick() {
        super.tick()
        this.transitionState = this.updateSlidingState(this.transitionState)
    }

    // State update function using external data
    update(playerData) {
        let money = 0
        let players = playerData.objects
        for (let i = 0; i < players.length; i++) {
            if (players[i].playerID == getUserID()) {
                money = players[i].stats.money
                break
            }
        }
        this.towerSpriteContainer.children.forEach((tower) => {
            if (money < this.towerJson[tower.type].cost) {
                tower.interactive = false
                tower.buttonMode = false
            } else {
                tower.interactive = true
                tower.buttonMode = true
            }
        })
    }
}
