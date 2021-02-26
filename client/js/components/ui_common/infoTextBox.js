
export class InfoTextBox extends PIXI.Container {
    constructor (x, y, width_px, height_px, message="", fontSize=20) {
        super()
        
        this.x = x
        this.y = y

        let xMargin = 24
        let yMargin = 32
        
        let baseImage = PIXI.Loader.shared.resources["client/assets/infoBoxes/infoBoxes.json"].textures["slanted_infobox_greyscale_1.png"]
        let baseTexture = new PIXI.Texture(baseImage, new PIXI.Rectangle(0, 0, 130, 130))
        let infoTextBox = new PIXI.NineSlicePlane(baseTexture, 64, 64, 64, 64)
        infoTextBox.width = width_px
        infoTextBox.height = height_px
        infoTextBox.alpha = 0.8
        this.addChild(infoTextBox)

        let defaultStyle = {
            fontFamily: 'Arial',
            fontSize: fontSize,
            wordWrap: true,
            wordWrapWidth: width_px - xMargin*2
        }

        this.text = new PIXI.Text(message, defaultStyle);
        this.text.anchor.set(0)
        this.text.x = xMargin
        this.text.y = yMargin
        this.addChild(this.text)
    }

    updateText(newMessage) {
        this.text.text = newMessage
    }
}
