export class GraphicButton extends PIXI.Container {
    constructor (width_px, height_px, x, y, message="", fontSize=20, col="0xAA88DD") {
        super()

        this.interactive = true
        this.buttonMode = true
        this.x = x
        this.y = y

        let graphics = new PIXI.Graphics();
        graphics.beginFill(col)
        graphics.drawRect(0, 0, width_px, height_px)
        graphics.x = -width_px/2 // Center on coordinates
        graphics.y = -height_px/2
        graphics.endFill()
        graphics.closePath()
        this.addChild(graphics)

        let defaultStyle = {
            fontFamily: 'Arial',
            fontSize: fontSize,
            fontWeight: 'bold',
            wordWrap: true,
            wordWrapWidth: width_px * 0.8
        }
        let text = new PIXI.Text(message, defaultStyle);
        text.anchor.set(0.5)
        this.addChild(text)
    }
}