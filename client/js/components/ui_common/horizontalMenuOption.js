import { BaseComponent } from "../game/base/baseComponent.js"

// This component is a horizontal box that can be stretched horizontally only, to avoid changing the angle of the slope
class HorizontalMenuOption extends BaseComponent {
    constructor (name, x, y, width_px, tint, textureName,
            lhsSlice_px, rhsSlice_px,
            shadowShiftX, shadowShiftY, shadowExtraWidthX, shadowExtraWidthY
    ) {
        super(name)
        this.x = x
        this.y = y

        let baseTexture = PIXI.Loader.shared.resources["client/assets/infoBoxes/infoBoxes.json"].textures[textureName]
        let infoTextBox = new PIXI.NineSlicePlane(baseTexture, lhsSlice_px, 0, rhsSlice_px, 0)
        infoTextBox.width = width_px
        infoTextBox.tint = tint

        let shadowTextBox = new PIXI.NineSlicePlane(baseTexture, lhsSlice_px, 0, rhsSlice_px, 0)
        shadowTextBox.width = infoTextBox.width + shadowExtraWidthX
        shadowTextBox.height = infoTextBox.height + shadowExtraWidthY
        shadowTextBox.x += shadowShiftX
        shadowTextBox.y += shadowShiftY
        shadowTextBox.tint = "0x000000"
        shadowTextBox.alpha = 0.8

        this.addChild(shadowTextBox)
        this.addChild(infoTextBox)
    }

    updateText(newMessage) {
        // TODO
    }
}

let xTransform = 4
let yTransform = 6

// This component is a horizontal box, with a shere of the top edge in the positive x direction
// It has a vertical slant on one side
// It is designed to be placed at the side of the screen
export class rightEndedHorizontalMenuOption extends HorizontalMenuOption {
    constructor (name, x, y, width_px, tint) {
        super(name, x, y, width_px, tint, "slanted_infobox_greyscale_1.png",
            1, 50,      // Slice widths
            0, yTransform, xTransform, 0  // Shadow transformations
        )
    }
}

// This component is a horizontal box, with a shere of the top edge in the positive x direction
// It has a vertical slant on both sides
// It is designed to be placed adjacent to a right or left ending menu option
export class doubleEndedHorizontalMenuOption extends HorizontalMenuOption {
    constructor (name, x, y, width_px, tint) {
        super(name, x, y, width_px, tint, "slanted_infobox_greyscale_2.png",
            50, 50,     // Slice widths
            xTransform, yTransform, 0, 0  // Shadow transformations
        )
    }
}
