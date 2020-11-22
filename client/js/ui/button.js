import { TextRect } from "../lobby_components/textRect.js"

export class GraphicButton extends TextRect {
    constructor (width_px, height_px, x, y, message="", fontSize=20, col="0xAA88DD", anchor_x=0.5, anchor_y=0.5) {
        super(width_px, height_px, x, y, message, fontSize, col, anchor_x, anchor_y)

        this.interactive = true
        this.buttonMode = true
    }
}