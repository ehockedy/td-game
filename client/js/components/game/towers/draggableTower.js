import { BaseInteractiveTower } from "./base/baseInteractiveTower.js"
import { PlaceTowerMenu } from "../ui/placeTowerMenu.js"
import { avgColourHexValues } from "../../../tools.js"
import { COLOURS } from "../../ui_common/style.js"

// Tower class that represents a tower in the menu the user can drag around and buy
export class DraggableTower extends BaseInteractiveTower {
    constructor(type, name, towerConfig, originX, originY, colour) {
        super(type, name, towerConfig, colour, true)
        this.cost = towerConfig[type].cost

        // The coordinates that the tower is bound to
        // They are relative to it's initial parent
        this.originX = originX
        this.originY = originY

        // Properties of movement
        this.dragging = false  // Whether the sprite is currently being moved
        this.inMenu = true  // Whether the sprite has been moved out of the menu

        // Whether a tower can be bought
        this.availiableToBuy = true
        this.disableInteractivity()

        // The buttons for confirming or declining placement
        this.placeTowerButtons = new PlaceTowerMenu(0, 0)
        this.placeTowerButtons.subscribe(this)
        this.addChild(this.placeTowerButtons)

        // Interaction behaviours
        this.towerSprite
            .on("pointerover", () => { this._onPointerOver() })
            .on("pointerout", () => { this._onPointerOut() })
            .on("pointerdown", () => { this._onPointerDown() })
            .on("pointerup", () => { this._onPointerUp() })
            .on("pointerupoutside", () => { this._onPointerUp() })
            .on("pointermove", (event) => { this._onPointerMove(event) })

        this.on("confirmTowerPlace", () => {this.observers.forEach((o) => { o.emit("confirmTowerPlace", this) })}) // Send to external subscribers
        this.on("confirmTowerPlace", this.reset)
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
        this.inMenu = true
        this.observers.forEach((o) => { o.emit("resetTower", this) })
    }

    disableInteractivity() {
        if (this.availiableToBuy) {
            this.towerSprite.buttonMode = false
            this.setTint(COLOURS.CANNOT_BUY_GREY)  // Darken to show cannot be bought
            this.availiableToBuy = false
        }
    }

    enableInteractivity() {
        if (!this.availiableToBuy) {
            this.towerSprite.buttonMode = true
            this.resetTint()
            this.availiableToBuy = true
        }
    }

    /**
     * Tells the place tower buttons the position to render relative to the tower
     * @param {boolean} flipY whether to flip in y axis so does not go off screen
     * @param {number} offsetY direction to off set in y direction, +ve is up, -ve is down, 0 is no offset
     */
    showPlaceTowerButtons(flipY, offsetY) {
        // If flip side enabled, switch the side of the tower the buttons are rendered on
        // This lets them be shown in cases where they would appear under other UI components
        this.placeTowerButtons.x = this.towerSprite.width / 2
        this.placeTowerButtons.resetYPosition()
        if (flipY) {
            this.placeTowerButtons.x *= -1
            this.placeTowerButtons.x -= Math.round(this.placeTowerButtons.width)
        }

        if (offsetY > 0) {
            this.placeTowerButtons.y += this.towerSprite.height/2
        } else if (offsetY < 0) {
            this.placeTowerButtons.y -= Math.round(this.towerSprite.height*1.5)
        }

        this.placeTowerButtons.visible = true
    }

    hidePlaceTowerButtons() {
        this.placeTowerButtons.visible = false
    }

    _onPointerOver() {
        if (this.inMenu) {
            this.observers.forEach((o) => { o.emit("pointerOverTower", this) })
        }
    }

    _onPointerOut() {
        this.observers.forEach((o) => { o.emit("pointerOutTower", this) })
    }

    _onPointerDown() {
        if (this.availiableToBuy) {
            this.dragging = true
            this.towerSpriteContainer.scale.set(0.8)
            this.placeTowerButtons.visible = false
            this.observers.forEach((o) => { o.emit("pressDownTower", this) })
        }
    }

    _onPointerUp() {
        this.dragging = false
        this.placeTowerButtons.visible = true
        this.towerSpriteContainer.scale.set(1)
        this.observers.forEach((o) => { o.emit("releaseTower", this) })
    }

    _onPointerMove(event) { // Remove this, and just have set position functions?
        if (this.dragging && this.availiableToBuy) {
            this.inMenu = false
            this.observers.forEach((o) => { o.emit("clickAndDragTower", event, this) })
        }
    }

    setTint(tint) {
        super.setTint(tint)

        // Since the tint will override the coloured part instead do an average so can still see
        // what colour is beneath
        // TODO maybe this should just be how the function works??
        this.towerColourSprite.children.forEach((sprite) => {
            sprite.tint = avgColourHexValues(sprite.baseTint, tint)
        })
    }

    setTowerInfo(towerConfig) {
        if (towerConfig) {
            this.placeTowerButtons.updateTowerInfo(towerConfig.displayInfo, towerConfig.cost?.toString(), towerConfig.displayName)
        }

    }
}