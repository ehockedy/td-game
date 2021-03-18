import { BaseComponent } from "../game/base/baseComponent.js"
import { addColourHexValues } from "../../tools.js"

/**
 * TODO
 * wallAttachment - "left", "right", "none"
 */
export class HorizontalMenuOption extends BaseComponent {
    constructor (name, x, y, width_px, tint, wallAttachment) {
        super(name)
        this.x = x
        this.y = y

        this._generateSprites(width_px, tint, wallAttachment)
    }

    // ~~~ Public ~~~
    setClickable() {}

    setTint(tint) {}

    setContent(newContent) {
    }

    // xOffset might be useful if it's a root component
    setTextCentral(newContent, xOffset=0) {
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


}



// // This component is a horizontal box that can be stretched horizontally only, to avoid changing the angle of the slope
// class HorizontalMenuOption extends BaseComponent {
//     constructor (name, x, y, width_px, tint, textureName,
//             lhsSlice_px, rhsSlice_px,
//             shadowShiftX, shadowShiftY, shadowExtraWidthX, shadowExtraWidthY
//     ) {
//         super(name)
//         this.start_x = x
//         this.start_y = y
//         this.x = x
//         this.y = y
//         this.startingTint = tint

//         let baseTexture = PIXI.Loader.shared.resources["client/assets/infoBoxes/infoBoxes.json"].textures[textureName]
//         this.infoTextBox = new PIXI.NineSlicePlane(baseTexture, lhsSlice_px, 0, rhsSlice_px, 0)
//         this.infoTextBox.width = width_px
//         this.infoTextBox.tint = tint

//         this.shadowTextBox = new PIXI.NineSlicePlane(baseTexture, lhsSlice_px, 0, rhsSlice_px, 0)
//         this.shadowTextBox.width = this.infoTextBox.width + shadowExtraWidthX
//         this.shadowTextBox.height = this.infoTextBox.height + shadowExtraWidthY
//         this.shadowTextBox.x += shadowShiftX
//         this.shadowTextBox.y += shadowShiftY
//         this.shadowTextBox.tint = "0x000000"
//         this.shadowTextBox.alpha = 0.8

//         this.addChild(this.shadowTextBox)
//         this.addChild(this.infoTextBox)
//     }

//     // Set properties that a clickable button would have
//     setClickable() {
//         this.infoTextBox.buttonMode = true
//         this.infoTextBox.interactive = true

//         // Lighten when hovered over
//         this.infoTextBox.on("mouseover", () => {
//             this.infoTextBox.tint = addColourHexValues(this.startingTint, "0x111111")
//             if (this.startingTintText) {
//                 this.content.style.fill = addColourHexValues(this.startingTintText, "0x111111")
//             }
//         })

//         // Return to original colour when mouse removed
//         this.infoTextBox.on("mouseout", () => {
//             this.infoTextBox.tint = this.startingTint
//             if (this.startingTintText) this.content.style.fill = this.startingTintText
//         })

//         // Move the button and its contents down so that it appears closer to the map, but not enough to fully cover the shadow
//         this.infoTextBox.on("pointerdown", () => {
//             this.infoTextBox.x = this.shadowTextBox.x / 2
//             this.infoTextBox.y = this.shadowTextBox.y / 2
//             if (this.content) {   // TODO this only covers central text content
//                 this.content.x = this.content.start_position.x + this.shadowTextBox.x / 2
//                 this.content.y = this.content.start_position.y + this.shadowTextBox.y / 2
//             }
//             this.scale.set(0.98)
//         })

//         this.infoTextBox.on("pointerup", () => {
//             this._onPointerup()
//             this.emit("selected")
//             this.observers.forEach((observer) => {observer.emit("selected")})  // TODO decide which is better, this or the above line
//         })
//         this.infoTextBox.on("pointerupoutside", () => { this._onPointerup() })
//     }

//     // Reset to original positions and scale
//     _onPointerup() {
//         this.infoTextBox.x = 0
//         this.infoTextBox.y = 0
//         if (this.content) {   // TODO this only covers central text content
//             this.content.position = this.content.start_position
//         }
//         this.scale.set(1)
//     }

//     setTint(tint) {
//         this.infoTextBox.tint = tint
//     }

//     setContent(newContent) {
//         if (this.content) this.removeChild(this.content)
//         this.content = newContent
//         this.addChild(this.content)
//     }

//     // xOffset might be useful if it's a root component
//     setTextCentral(newContent, xOffset=0) {
//         if (this.content) this.removeChild(this.content)
//         this.content = newContent
//         this.content.anchor.set(0.5)
//         this.content.start_position = new PIXI.Point(this.infoTextBox.width / 2 + xOffset, this.infoTextBox.height / 2)
//         this.content.position = this.content.start_position
//         this.startingTintText = newContent.style.fill
//         this.addChild(this.content)
//     }

//     // Override
//     stopInteraction() {
//         this.infoTextBox.buttonMode = false
//         this.infoTextBox.interactive = false
//     }

//     // Override
//     startInteraction() {
//         this.infoTextBox.buttonMode = true
//         this.infoTextBox.interactive = true
//     }
// }

// let xTransform = 4
// let yTransform = 6

// // This component is a horizontal box, with a shere of the top edge in the positive x direction
// // It has a vertical slant on the right side
// // It is designed to be placed at the left side of the screen
// export class rightEndedHorizontalMenuOption extends HorizontalMenuOption {
//     constructor (name, x, y, width_px, tint) {
//         super(name, x, y, width_px, tint, "slanted_infobox_greyscale_1.png",
//             1, 50,      // Slice widths
//             0, yTransform, xTransform, 0  // Shadow transformations
//         )
//     }
// }

// // This component is a horizontal box, with a shere of the top edge in the negative x direction
// // It has a vertical slant on the left side
// // It is designed to be placed at the right side of the screen
// export class leftEndedHorizontalMenuOption extends HorizontalMenuOption {
//     constructor (name, x, y, width_px, tint) {
//         super(name, x, y, width_px, tint, "slanted_infobox_greyscale_1.png",
//             1, 50,      // Slice widths
//             -xTransform, -yTransform, 0, 0  // Shadow transformations
//         )

//         // Pivot it so that x, y positions control the top left corner
//         // This wil make it easy to position it on the right hand side of the view
//         this.pivot.y = this.infoTextBox.height
//         this.angle = 180  // rotate so the slante slot in with the slants of the elements to the left of it
//     }
// }

// // This component is a horizontal box, with a shere of the top edge in the positive x direction
// // It has a vertical slant on both sides
// // It is designed to be placed adjacent to a right or left ending menu option
// export class doubleEndedHorizontalMenuOption extends HorizontalMenuOption {
//     constructor (name, x, y, width_px, tint) {
//         super(name, x, y, width_px, tint, "slanted_infobox_greyscale_2.png",
//             50, 50,     // Slice widths
//             xTransform, yTransform, 0, 0  // Shadow transformations
//         )
//     }
// }
