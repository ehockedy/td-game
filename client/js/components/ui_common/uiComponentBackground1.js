import { BaseComponent } from "../game/base/baseComponent.js"

// This componenet is a horizontal box, with a shere of the top edge in the positive x direction
// It is designed to be placed at the side of the screen
// It can be stretched horizontally only, to avoid changing the angle of the slope
export class UIComponentBackground1 extends BaseComponent {
    constructor (name, x, y, width_px, tint) {
        super(name)
        this.x = x
        this.y = y

        let baseTexture = PIXI.Loader.shared.resources["client/assets/infoBoxes/infoBoxes.json"].textures["slanted_infobox_greyscale_1.png"]
        let infoTextBox = new PIXI.NineSlicePlane(baseTexture, 1, 0, 64, 0)
        infoTextBox.width = width_px
        infoTextBox.tint = tint

        let shadowTextBox = new PIXI.NineSlicePlane(baseTexture, 1, 0, 64, 0)
        shadowTextBox.width = infoTextBox.width + 2
        shadowTextBox.height = infoTextBox.height
        shadowTextBox.y = infoTextBox.y + 5
        shadowTextBox.tint = "0x000000"
        shadowTextBox.alpha = 0.7

        this.addChild(shadowTextBox)
        this.addChild(infoTextBox)
    }

    updateText(newMessage) {
        // TODO
    }
}
