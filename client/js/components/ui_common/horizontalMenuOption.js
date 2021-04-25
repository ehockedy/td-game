import { BaseComponent } from "../game/base/baseComponent.js"
import { addColourHexValues } from "../../tools.js"

/**
 * An element that exists in a menu on the game UI
 * Wall attachment is the side of the element that is in contact with the edge of a component - probably the screen
 * This side will have a flat edge and no border so it looks like the element continues off screen to create a neat look.
 */
class HorizontalMenuOption extends BaseComponent {
    constructor (name, x, y, width_px, tint, wallAttachment) {
        super(name)
        this.x = x
        this.y = y
        this.baseTint = tint
        this.selectionEventName = "selected"  // The event to emit when selected
        this.defaultScale = 1

        this.baseContentOffsetX = 0
        this._generateSprites(width_px, tint, wallAttachment)

        this.text = new PIXI.Container()
        this.text.x += this.baseContentOffsetX
        this.addChild(this.text)
    }

    // ~~~ Public ~~~

    // Add a PIXI.Text object onto the element
    addText(text, x_percent=0.5, y_percent=0.5) {
        // Position relative to the menu sprite
        text.x = x_percent * this.menuSprite.width
        text.y = y_percent * this.menuSprite.height
        text.baseTint = text.style.fill  // Add this property to record the original colour
        this.text.addChild(text)
    }

    // Given a string, render it in the given style in the middle of the element
    addTextCentral(message, style) {
        let text = new PIXI.Text(message, style)
        text.anchor.set(0.5, 0.5)
        this.addText(text, 0.5, 0.5)
    }

    // Override the name of the event to emit when selected
    setSelectEventName(name) {
        this.selectionEventName = name
    }

    setDefaultScale(scale) {
        this.defaultScale = scale
        this.scale.set(scale)
    }

    // ~~~ Private ~~~

    // Based on where the menu option is places relative to the wall, determine the shape and shadow behaviour and generate those sprites
    _generateSprites(width_px, tint, wallAttachment) {
        let oneSidedSprite = "slanted_infobox_greyscale_1.png"
        let doubleSidedSprite = "slanted_infobox_greyscale_2.png"
        let xDiff_px = 4
        let slopedEndSize_px = 50
        let flatEndSize_px = 1

        switch(wallAttachment) {
            //  _________
            // |        /
            // |_______/
            //
            case "left":
                this._generateSprite(width_px, tint, oneSidedSprite, flatEndSize_px, slopedEndSize_px, 0, xDiff_px)
                break
            //    _______
            //   /       | 
            //  /________|
            //
            case "right":
                this._generateSprite(width_px, tint, oneSidedSprite, flatEndSize_px, slopedEndSize_px, 0, -xDiff_px)
                this.menuSprite.scale.set(-1)
                this.shadowSprite.scale.set(-1)
                this.menuSprite.pivot.y = this.menuSprite.height
                this.shadowSprite.pivot.y = this.shadowSprite.height
                this.baseContentOffsetX = -this.menuSprite.width
                break
            //   _________
            //  /        /
            // /________/
            //
            case "none":
            default:
                this._generateSprite(width_px, tint, doubleSidedSprite, slopedEndSize_px, slopedEndSize_px, xDiff_px, 0)
                break
        }
    }

    // Generate the menu object and it's shadow based on the configuration
    _generateSprite(width_px, tint, textureName, lhsSlice_px, rhsSlice_px, xShift_px, xGrow_px) {
        let baseTexture = PIXI.Loader.shared.resources["client/assets/infoBoxes/infoBoxes.json"].textures[textureName]
        this.menuSprite = new PIXI.NineSlicePlane(baseTexture, lhsSlice_px, 0, rhsSlice_px, 0)
        this.menuSprite.width = width_px
        this.menuSprite.tint = tint
        
        this.shadowSprite = new PIXI.NineSlicePlane(baseTexture, lhsSlice_px, 0, rhsSlice_px, 0)
        this.shadowSprite.width = width_px
        this.shadowSprite.tint = "0x000000"
        this.shadowSprite.alpha = 0.8
        this.shadowSprite.x += xShift_px
        this.shadowSprite.y += 6  // Shift the shadow 6 pixels down for all types
        this.shadowSprite.width += xGrow_px

        this.addChild(this.shadowSprite)  // Add shadow first so it appears beneath
        this.addChild(this.menuSprite)
    }


    // ~~~ Events ~~~
    _lighten() {
        let colourDiff = "0x111111"
        this.menuSprite.tint = addColourHexValues(this.baseTint, colourDiff)
        this.text.children.forEach((text) => { text.style.fill = addColourHexValues(text.baseTint, colourDiff)})
    }

    _resetColour() {
        this.menuSprite.tint = this.baseTint
        this.text.children.forEach((text) => { text.style.fill = text.baseTint})
    }

    _press() {
        // Bring the content of the button closer to the "ground" by moving it towards the shadow
        this.menuSprite.x = this.shadowSprite.x / 2
        this.menuSprite.y = this.shadowSprite.y / 2
        this.text.x = this.shadowSprite.x / 2 + this.baseContentOffsetX
        this.text.y = this.shadowSprite.y / 2
        this.scale.set(this.defaultScale * 0.98)  // Shrink it a bit
    }

    _release() {
        // Reset the positions of the content of the button
        this.menuSprite.x = 0
        this.menuSprite.y = 0
        this.text.x = this.baseContentOffsetX
        this.text.y = 0
        this.scale.set(this.defaultScale)  // Reset to original size
    }

    _select() {
        // The option has been selected
        // Send the event and the selected menu option object
        this.observers.forEach((observer) => {observer.emit(this.selectionEventName, this)})
    }

}

// A menu element that is not interactive
export class StaticHorizontalMenuOption extends HorizontalMenuOption {
    constructor (name, x, y, width_px, tint, wallAttachment) {
        super(name, x, y, width_px, tint, wallAttachment)
    }
}

// A menu element that can be pressed down and springs back up when released
// Used to set a behaviour or trigger an event
export class ButtonHorizontalMenuOption extends HorizontalMenuOption {
    constructor (name, x, y, width_px, tint, wallAttachment) {
        super(name, x, y, width_px, tint, wallAttachment)
        this._setUpInteractions()
    }

    _setUpInteractions() {
        this.menuSprite.interactive = true
        this.menuSprite.buttonMode = true
        this.menuSprite
            .on("mouseover", () => { this._lighten() })
            .on("mouseout", () => { this._resetColour() })
            .on("mousedown", () => { this._press() })
            .on("mouseup", () => {
                this._release()
                this._select()
            })
            .on("mouseupoutside", () => {
                this._release()
            })
    }
}

// A menu element that can be pressed down and is released when another element in the same menu is pressed
// Used to toggle an option from a set
export class SwitchHorizontalMenuOption extends HorizontalMenuOption {
    constructor (name, x, y, width_px, tint, wallAttachment) {
        super(name, x, y, width_px, tint, wallAttachment)
        this._setUpInteractions()
        this.isSelected = false
    }

    _setUpInteractions() {
        this.menuSprite.interactive = true
        this.menuSprite.buttonMode = true
        this.menuSprite
            .on("mouseover", () => { this._lighten() })
            .on("mouseout", () => { if (!this.isSelected) this._resetColour() })
            .on("mousedown", () => {
                if (!this.isSelected) {
                    this.isSelected = true
                    this._lighten()
                    this._press()
                    this._select()
                }
            })
    }

    setActive() {
        // This is the selected option in the menu
        // But do not actually trigger the select action - only the user can do this
        this.isSelected = true
        this._lighten()
        this._press()
    }

    unsetActive() {
        this.isSelected = false
        this._resetColour()
        this._release()
    }
}
