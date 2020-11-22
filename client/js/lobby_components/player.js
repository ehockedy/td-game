import { TextRect } from "../lobby_components/textRect.js"

export class Player extends PIXI.Container {
    constructor(index, width_px, height_px, x, y, anchorX, anchorY) {
        super()

        this.index = index
        this.x = x
        this.y = y

        this.noPlayerPlaceholder = new TextRect(width_px, height_px, 0, 0, this.index, 40, 0x999999, anchorX, anchorY)
        this.addChild(this.noPlayerPlaceholder)
    }
}
