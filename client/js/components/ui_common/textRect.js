
export class TextRect extends PIXI.Container {
    constructor (width_px, height_px, x, y, message="", fontSize=20, col="0xAA88DD", anchor_x=0.5, anchor_y=0.5) {
        super()
        
        this.x = x
        this.y = y

        let graphics= new PIXI.Graphics();
        graphics.beginFill(col)
        graphics.drawRect(0, 0, width_px, height_px)
        graphics.x = -width_px*anchor_x
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
        this.text = new PIXI.Text(message, defaultStyle);
        this.text.anchor.set(0.5)
        this.text.x = graphics.x + width_px/2 // Fix text to center of button
        this.text.y = graphics.y + height_px/2
        this.addChild(this.text)
    }

    updateText(newMessage) {
        this.text.text = newMessage
    }
}