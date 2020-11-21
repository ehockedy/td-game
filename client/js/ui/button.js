export class GraphicButton extends PIXI.Container {
    constructor (width_px, height_px, x, y, message="", fontSize=20, col="0xAA88DD", anchor_x=0.5, anchor_y=0.5) {
        super()

        this.interactive = true
        this.buttonMode = true
        this.x = x
        this.y = y

        let graphics = new PIXI.Graphics();
        graphics.beginFill(col)
        graphics.drawRect(0, 0, width_px, height_px)
        graphics.x = -width_px*anchor_x // Center on coordinates
        graphics.y = -height_px*anchor_y
        graphics.endFill()
        graphics.closePath()
        this.addChild(graphics)

        let defaultStyle = {
            align: 'center',
            fontFamily: 'Arial',
            fontSize: fontSize,
            fontWeight: 'bold',
            wordWrap: true,
            wordWrapWidth: width_px * 0.8
        }
        let text = new PIXI.Text(message, defaultStyle);
        text.anchor.set(0.5)
        if (anchor_x != 0.5) text.x = (-width_px/2)*anchor_x // If there is an offset of the button, then move text to keep it in the center of the botton
        if (anchor_y != 0.5) text.y = (-height_px/2)*anchor_y
        this.addChild(text)
    }
}