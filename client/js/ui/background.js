
export class GraphicBackground extends PIXI.Container {
    constructor(width_px, height_px, x, y, colour=0xBB9933) {
        super()
        this.x = x
        this.y = y

        let background = new PIXI.Graphics()
        background.beginFill(colour)
        background.lineStyle(4, 0x11AA05, 1, 0.5)
        background.drawRoundedRect(-width_px/2, -height_px/2, width_px, height_px, 10)
        background.endFill()
        background.closePath()

        this.addChild(background)
    }
}