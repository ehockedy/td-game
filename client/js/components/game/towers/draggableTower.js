import { BaseInteractiveTower } from "./base/baseInteractiveTower.js"
import { PlaceTowerMenu } from "../ui/placeTowerMenu.js"

// Tower class that represents a tower in the menu the user can drag around and buy
export class DraggableTower extends BaseInteractiveTower {
    constructor(type, name, towerConfig, originX, originY) {
        super(type, name, towerConfig)
        this.cost = towerConfig[type].cost

        // The coordinates that the tower is bound to
        // They are relative to it's initial parent
        this.originX = originX
        this.originY = originY

        // Properties of movement
        this.dragging = false  // Whether the sprite is currently being moved

        // Whether a tower can be bought
        this.availiableToBuy = true

        // The buttons for confirming or declining placement
        this.placeTowerButtons = new PlaceTowerMenu(0, 0)
        this.placeTowerButtons.x -= this.placeTowerButtons.width / 2
        this.placeTowerButtons.y += this.towerSprite.height / 2
        this.placeTowerButtons.subscribe(this)
        this.addChild(this.placeTowerButtons)

        // Interaction behaviours
        this.towerSprite
            .on("pointerdown", () => { this._onPointerDown() })
            .on("pointerup", () => { this._onPointerUp() })
            .on("pointerupoutside", () => { this._onPointerUp() })
            .on("pointermove", (event) => { this._onPointerMove(event) })

        this.on("confirmTowerPlace", () => {this.observers.forEach((o) => { o.emit("confirmTowerPlace", this) })}) // Send to external subscribers
        this.on("denyTowerPlace", this.reset)
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
        if (this.availiableToBuy) {
            this.towerSprite.interactive = false
            this.towerSprite.buttonMode = false
            this._setTint("0x555555")  // Darken to show cannot be bought
            this.availiableToBuy = false
        }
    }

    enableInteractivity() {
        if (!this.availiableToBuy) {
            this.towerSprite.interactive = true
            this.towerSprite.buttonMode = true
            this._setTint("0xFFFFFF")
            this.availiableToBuy = true
        }
    }

    showPlaceTowerButtons() {
        this.placeTowerButtons.visible = true
    }

    hidePlaceTowerButtons() {
        this.placeTowerButtons.visible = false
    }

    _onPointerDown() {
        this.dragging = true
        this.towerSpriteContainer.scale.set(0.8)
        this.placeTowerButtons.visible = false
        this.observers.forEach((o) => { o.emit("pressDownTower", this) })
    }

    _onPointerUp() {
        this.dragging = false
        this.placeTowerButtons.visible = true
        this.towerSpriteContainer.scale.set(1)
        this.observers.forEach((o) => { o.emit("releaseTower", this) })
    }

    _onPointerMove(event) { // Remove this, and just have set position functions?
        if (this.dragging) {
            this.observers.forEach((o) => { o.emit("clickAndDragTower", event, this) })
        }
    }

    _setTint(tint) {
        this.towerSpriteContainer.children.forEach((sprite) => {
            if (sprite.children.length > 0) {
                sprite.children.forEach((childSprite) => {
                    childSprite.tint = tint
                })
            } else {
                sprite.tint = tint
            }
        })
    }
}