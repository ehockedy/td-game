import { BaseInteractiveTower } from "./baseInteractiveTower.js"
import { GraphicButton } from "../../ui_common/button.js"
import { getPositionWithinEquallySpacedObjects } from "../../../tools.js"


export class BaseDraggableTower extends BaseInteractiveTower {
    constructor(type, name, towerConfig, originX, originY) {
        super(type, name, towerConfig)
        this.cost = towerConfig[type].cost

        // The coordinates that the tower is bound to
        // They are relative to it's initial parent
        this.originX = originX
        this.originY = originY

        // Properties of movement
        this.dragging = false  // Whether the sprite is currently being moved

        // The buttons for confirming or declining placement
        this.placeTowerButtons = this._getPlaceTowerButtons()
        this.addChild(this.placeTowerButtons)

        // Interaction behaviours
        this.towerSprite
            .on("pointerdown", () => { this._onPointerDown() })
            .on("pointerup", () => { this._onPointerUp() })
            .on("pointerupoutside", () => { this._onPointerUp() })
            .on("pointermove", (event) => { this._onPointerMove(event) })
        
        this.on("clear", this.reset)

        this.reset() // Initialise state
    }

    reset() {
        this.setX(this.originX)
        this.setY(this.originY)
        this.hideRangeCircle()
        this.hidePlaceTowerButtons()
        this.dragging = false
    }

    disableInteractivity() { 
        this.towerSprite.interactive = false
        this.towerSprite.buttonMode = false
    }

    enableInteractivity() { 
        this.towerSprite.interactive = true
        this.towerSprite.buttonMode = true
    }

    showPlaceTowerButtons() {
        this.placeTowerButtons.visible = true
    }

    hidePlaceTowerButtons() {
        this.placeTowerButtons.visible = false
    }

    _onPointerDown() {
        this.dragging = true
        this.placeTowerButtons.visible = false
        this.observers.forEach((o) => { o.emit("pressDownTower", this) })
    }

    _onPointerUp() {
        this.dragging = false
        this.placeTowerButtons.visible = true
        this.observers.forEach((o) => { o.emit("releaseTower", this) })
    }

    _onPointerMove(event) { // Remove this, and just have set position functions?
        if (this.dragging) {
            this.observers.forEach((o) => { o.emit("clickAndDragTower", event, this) })
        }
    }

    _getPlaceTowerButtons() {
        let localContainer = new PIXI.Container()
        localContainer.visible = false

        let yOffset = 0
        let buttonHeight = 24
        let buttonWidth = 24
        let width_px = buttonWidth * 2 + 16 // gap between buttons

        let confirmButton = new GraphicButton(buttonWidth, buttonHeight, getPositionWithinEquallySpacedObjects(1, 2, buttonWidth, width_px)-width_px/2, yOffset, "\u{1F5F8}" , 20, "0x22FF22")
        let confirm = () => {
            this.observers.forEach((o) => { o.emit("confirmTowerPlace", this) })
        }
        confirmButton.on("click", confirm)
        confirmButton.on("tap", confirm)
        localContainer.addChild(confirmButton)

        let cancelButton = new GraphicButton(buttonWidth, buttonHeight, getPositionWithinEquallySpacedObjects(2, 2, buttonWidth, width_px) - width_px/2, yOffset, "\u{2717}", 20, "0xFF2222")
        let deny = () => {
            this.reset()
        }
        cancelButton.on("click", deny)
        cancelButton.on("tap", deny)
        localContainer.addChild(cancelButton)

        return localContainer
    }
}